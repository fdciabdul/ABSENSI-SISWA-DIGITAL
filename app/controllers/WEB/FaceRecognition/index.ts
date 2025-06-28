import type { HttpContext } from '@adonisjs/core/http'
import Student from '#models/student'
import FaceData from '#models/face_data'
import Attendance from '#models/attendance'
import { DateTime } from 'luxon'

export default class FaceRecognitionController {
  async index({ view }: HttpContext) {
    const students = await Student.query()
      .preload('class')
      .preload('faceData', (query) => {
        query.where('isActive', true)
      })
      .where('isActive', true)
      .orderBy('name')

    return view.render('pages/face-recognition/index', { students })
  }

  async register({ view }: HttpContext) {
    const students = await Student.query()
      .preload('class')
      .where('isActive', true)
      .orderBy('name')

    return view.render('pages/face-recognition/register', { students })
  }
async storeRegistrationAPI({ request, response }: HttpContext) {
  try {
    const studentId = request.input('student_id')
    const faceDescriptor = request.input('face_descriptor')

    console.log('Received registration request for student ID:', studentId)
    console.log('Face descriptor length:', faceDescriptor?.length)

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return response.badRequest({ message: 'Invalid face descriptor' })
    }

    // Ensure all values are numbers
    const cleanDescriptor = faceDescriptor.map(val => Number(val))
    
    if (cleanDescriptor.some(val => isNaN(val))) {
      return response.badRequest({ message: 'Face descriptor contains invalid values' })
    }

    const student = await Student.find(studentId)
    if (!student) {
      return response.badRequest({ message: 'Student not found' })
    }

    // Check if student already has face data
    const existingFaceData = await FaceData.query()
      .where('studentId', studentId)
      .where('isActive', true)
      .first()

    if (existingFaceData) {
      // Update existing face data
      existingFaceData.faceDescriptor = cleanDescriptor
      existingFaceData.confidence = 100
      await existingFaceData.save()
      console.log('Updated existing face data for student:', student.name)
    } else {
      // Create new face data
      await FaceData.create({
        studentId: parseInt(studentId),
        faceDescriptor: cleanDescriptor,
        isActive: true,
        confidence: 100
      })
      console.log('Created new face data for student:', student.name)
    }

    return response.json({ 
      message: 'Face registered successfully',
      student: {
        id: student.id,
        name: student.name,
        studentId: student.studentId
      }
    })
  } catch (error) {
    console.error('Error storing face data:', error)
    return response.internalServerError({ message: 'Failed to register face', error: error.message })
  }
}
  async storeRegistration({ request, response, session }: HttpContext) {
    try {
      const studentId = request.input('student_id')
      const faceDescriptor = request.input('face_descriptor')

      if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
        session.flash('error', 'Data wajah tidak valid')
        return response.redirect().back()
      }

      const student = await Student.find(studentId)
      if (!student) {
        session.flash('error', 'Siswa tidak ditemukan')
        return response.redirect().back()
      }

      // Check if student already has face data
      const existingFaceData = await FaceData.query()
        .where('studentId', studentId)
        .where('isActive', true)
        .first()

      if (existingFaceData) {
        session.flash('error', 'Siswa sudah memiliki data wajah terdaftar')
        return response.redirect().back()
      }

      await FaceData.create({
        studentId: parseInt(studentId),
        faceDescriptor,
        isActive: true,
        confidence: 100
      })

      session.flash('success', 'Wajah berhasil didaftarkan')
      return response.redirect().toRoute('face-recognition.index')
    } catch (error) {
      console.error('Error storing face data:', error)
      session.flash('error', 'Terjadi kesalahan saat mendaftarkan wajah')
      return response.redirect().back()
    }
  }

  async getFaceData({ response }: HttpContext) {
    try {
      const faceDataList = await FaceData.query()
        .preload('student', (query) => {
          query.preload('class')
        })
        .where('isActive', true)

      const formattedData = faceDataList.map(face => ({
        studentId: face.studentId,
        descriptor: face.faceDescriptor,
        student: {
          id: face.student.id,
          name: face.student.name,
          studentId: face.student.studentId,
          class: {
            name: face.student.class ? face.student.class.name : 'Unknown',
            gradeLevel: face.student.class ? face.student.class.gradeLevel : 'Unknown'
          }
        }
      }))

      return response.json(formattedData)
    } catch (error) {
      console.error('Error fetching face data:', error)
      return response.internalServerError({ message: 'Gagal mengambil data wajah' })
    }
  }

  async recordAttendance({ request, response }: HttpContext) {
    try {
      const studentId = request.input('student_id')
      const confidence = request.input('confidence', 0)

      if (!studentId) {
        return response.badRequest({ message: 'Student ID tidak valid' })
      }

      const student = await Student.query()
        .where('id', studentId)
        .preload('class')
        .first()

      if (!student) {
        return response.badRequest({ message: 'Siswa tidak ditemukan' })
      }

      const today = DateTime.now().startOf('day')
      
      // Check if already recorded today
      const existingAttendance = await Attendance.query()
        .where('studentId', studentId)
        .where('attendanceDate', '>=', today.toSQL())
        .where('attendanceDate', '<', today.plus({ days: 1 }).toSQL())
        .first()

      if (existingAttendance) {
        // Update checkout time
        existingAttendance.checkOutTime = DateTime.now()
        await existingAttendance.save()

        return response.json({
          success: true,
          message: `Selamat datang kembali, ${student.name}! Waktu keluar tercatat.`,
          attendance: existingAttendance,
          type: 'checkout'
        })
      }

      // Create new attendance record
      const now = DateTime.now()
      const status = this.determineStatus(now)

      const attendance = await Attendance.create({
        studentId: parseInt(studentId),
        status,
        checkInTime: now,
        attendanceDate: today,
        isManualEntry: false,
        notes: `Face Recognition (${confidence.toFixed(1)}% confidence)`
      })

      return response.json({
        success: true,
        message: `Selamat datang, ${student.name}! Absensi tercatat (${status}).`,
        attendance,
        type: 'checkin'
      })
    } catch (error) {
      console.error('Attendance error:', error)
      return response.internalServerError({ message: 'Gagal mencatat absensi' })
    }
  }

  async getStudents({ response }: HttpContext) {
    try {
      const students = await Student.query()
        .preload('class')
        .where('isActive', true)
        .orderBy('name')

      return response.json(students)
    } catch (error) {
      console.error('Error fetching students:', error)
      return response.internalServerError({ message: 'Gagal mengambil data siswa' })
    }
  }

  async deleteFaceData({ params, response, session }: HttpContext) {
    try {
      const faceData = await FaceData.findOrFail(params.id)
      faceData.isActive = false
      await faceData.save()

      session.flash('success', 'Data wajah berhasil dihapus')
      return response.redirect().back()
    } catch (error) {
      console.error('Error deleting face data:', error)
      session.flash('error', 'Gagal menghapus data wajah')
      return response.redirect().back()
    }
  }

  private determineStatus(time: DateTime): string {
    const hour = time.hour
    const minute = time.minute

    if (hour < 7 || (hour === 7 && minute <= 15)) {
      return 'present'
    } else if (hour === 7 && minute <= 30) {
      return 'late'
    } else {
      return 'late'
    }
  }
}