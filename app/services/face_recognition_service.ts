
import sharp from 'sharp'
import * as faceapi from 'face-api.js'
import { Canvas, Image, ImageData, createCanvas, loadImage } from 'canvas'
import Student from '#models/student'
import FaceData from '#models/face_data'
import Attendance from '#models/attendance'
import { DateTime } from 'luxon'

// Polyfill for face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

export default class FaceRecognitionService {
  private isInitialized = false
  private faceDescriptors: Map<number, Float32Array[]> = new Map()

  async initialize() {
    if (this.isInitialized) return

    // Load face-api.js models
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    
    await this.loadStoredFaces()
    this.isInitialized = true
  }

  async addFaceForStudent(studentId: number, imageBuffer: Buffer): Promise<boolean> {
    try {
      const img = await loadImage(imageBuffer)
      const canvas = createCanvas(img.width, img.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const detections = await faceapi
        .detectAllFaces(canvas)
        .withFaceLandmarks()
        .withFaceDescriptors()

      if (detections.length === 0) {
        throw new Error('No face detected in image')
      }

      if (detections.length > 1) {
        throw new Error('Multiple faces detected. Please use image with single face')
      }

      const faceDescriptor = detections[0].descriptor

      // Store in database
      await FaceData.create({
        studentId,
        faceDescriptor: Array.from(faceDescriptor),
        isActive: true
      })

      // Update memory cache
      if (!this.faceDescriptors.has(studentId)) {
        this.faceDescriptors.set(studentId, [])
      }
      this.faceDescriptors.get(studentId)!.push(faceDescriptor)

      return true
    } catch (error) {
      console.error('Error adding face for student:', error)
      return false
    }
  }

  async recognizeFace(imageBuffer: Buffer): Promise<{
    studentId: number | null,
    confidence: number,
    student?: any
  }> {
    try {
      const img = await loadImage(imageBuffer)
      const canvas = createCanvas(img.width, img.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const detection = await faceapi
        .detectSingleFace(canvas)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        return { studentId: null, confidence: 0 }
      }

      const inputDescriptor = detection.descriptor
      let bestMatch: { studentId: number, confidence: number } | null = null

      // Compare with stored faces
      for (const [studentId, descriptors] of this.faceDescriptors.entries()) {
        for (const storedDescriptor of descriptors) {
          const distance = faceapi.euclideanDistance(inputDescriptor, storedDescriptor)
          const confidence = Math.max(0, (1 - distance) * 100)

          if (confidence > 70 && (!bestMatch || confidence > bestMatch.confidence)) {
            bestMatch = { studentId, confidence }
          }
        }
      }

      if (bestMatch) {
        const student = await Student.query()
          .where('id', bestMatch.studentId)
          .preload('class')
          .first()

        return {
          studentId: bestMatch.studentId,
          confidence: bestMatch.confidence,
          student
        }
      }

      return { studentId: null, confidence: 0 }
    } catch (error) {
      console.error('Error recognizing face:', error)
      return { studentId: null, confidence: 0 }
    }
  }

  async recordAttendanceByFace(imageBuffer: Buffer, deviceId?: number): Promise<{
    success: boolean,
    message: string,
    attendance?: any
  }> {
    const recognition = await this.recognizeFace(imageBuffer)

    if (!recognition.studentId) {
      return {
        success: false,
        message: 'Wajah tidak dikenali. Silakan daftar wajah terlebih dahulu.'
      }
    }

    const today = DateTime.now().startOf('day')
    
    // Check if already recorded today
    const existingAttendance = await Attendance.query()
      .where('studentId', recognition.studentId)
      .where('attendanceDate', '>=', today.toSQL())
      .where('attendanceDate', '<', today.plus({ days: 1 }).toSQL())
      .first()

    if (existingAttendance) {
      // Update checkout time
      existingAttendance.checkOutTime = DateTime.now()
      await existingAttendance.save()

      return {
        success: true,
        message: `Selamat datang kembali, ${recognition.student?.name}! Waktu keluar tercatat.`,
        attendance: existingAttendance
      }
    }

    // Create new attendance record
    const now = DateTime.now()
    const status = this.determineStatus(now)

    const attendance = await Attendance.create({
      studentId: recognition.studentId,
      deviceId,
      status,
      checkInTime: now,
      attendanceDate: today,
      isManualEntry: false,
      notes: `Face Recognition (${recognition.confidence.toFixed(1)}% confidence)`
    })

    return {
      success: true,
      message: `Selamat datang, ${recognition.student?.name}! Absensi tercatat (${status}).`,
      attendance
    }
  }

  private async loadStoredFaces() {
    const faceDataList = await FaceData.query()
      .where('isActive', true)
      .preload('student')

    this.faceDescriptors.clear()

    for (const faceData of faceDataList) {
      const descriptor = new Float32Array(faceData.faceDescriptor)
      
      if (!this.faceDescriptors.has(faceData.studentId)) {
        this.faceDescriptors.set(faceData.studentId, [])
      }
      this.faceDescriptors.get(faceData.studentId)!.push(descriptor)
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