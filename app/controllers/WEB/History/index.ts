import type { HttpContext } from '@adonisjs/core/http'
import Student from '#models/student'
import Attendance from '#models/attendance'
import Fingerprint from '#models/fingerprint'
import FaceData from '#models/face_data'
import Class from '#models/class'
import { DateTime } from 'luxon'
import XLSX  from 'xlsx';
export default class StudentHistoryController {
    async attendance({ params, view, request }: HttpContext) {
        const student = await Student.query()
            .where('id', params.id)
            .preload('class', (classQuery) => {
                classQuery.preload('teacher')
            })
            .firstOrFail()

        const page = request.input('page', 1)
        const statusFilter = request.input('status', '')
        const dateFrom = request.input('date_from', '')
        const dateTo = request.input('date_to', '')
        const deviceFilter = request.input('device', '')

        let query = Attendance.query()
            .where('studentId', student.id)
            .preload('schedule', (scheduleQuery) => {
                scheduleQuery.preload('class').preload('teacher')
            })
            .preload('device')

        if (statusFilter) {
            query = query.where('status', statusFilter)
        }

        if (dateFrom) {
            query = query.where('attendanceDate', '>=', DateTime.fromFormat(dateFrom, 'yyyy-MM-dd'))
        }

        if (dateTo) {
            query = query.where('attendanceDate', '<=', DateTime.fromFormat(dateTo, 'yyyy-MM-dd'))
        }

        if (deviceFilter === 'manual') {
            query = query.where('isManualEntry', true)
        } else if (deviceFilter === 'fingerprint') {
            query = query.whereNotNull('deviceId').where('isManualEntry', false)
        }

        const attendances = await query
            .orderBy('attendanceDate', 'desc')
            .orderBy('checkInTime', 'desc')
            .paginate(page, 15)

        attendances.baseUrl(`/students/${student.id}/attendance-history`)

        const stats = await this.getAttendanceStats(student.id, dateFrom, dateTo)

        return view.render('pages/students/attendance-history', {
            student,
            attendances,
            stats,
            statusFilter,
            dateFrom,
            dateTo,
            deviceFilter
        })
    }

    async fingerprint({ params, view, request }: HttpContext) {
        const student = await Student.query()
            .where('id', params.id)
            .preload('class', (classQuery) => {
                classQuery.preload('teacher')
            })
            .firstOrFail()

        const page = request.input('page', 1)
        const statusFilter = request.input('status', '')
        const qualityFilter = request.input('quality', '')

        let query = Fingerprint.query()
            .where('studentId', student.id)

        if (statusFilter === 'active') {
            query = query.where('isActive', true)
        } else if (statusFilter === 'inactive') {
            query = query.where('isActive', false)
        }

        if (qualityFilter) {
            if (qualityFilter === 'high') {
                query = query.where('quality', '>=', 80)
            } else if (qualityFilter === 'medium') {
                query = query.where('quality', '>=', 60).where('quality', '<', 80)
            } else if (qualityFilter === 'low') {
                query = query.where('quality', '<', 60)
            }
        }

        const fingerprints = await query
            .orderBy('createdAt', 'desc')
            .paginate(page, 10)

        fingerprints.baseUrl(`/students/${student.id}/fingerprint-history`)

        const fingerprintStats = await this.getFingerprintStats(student.id)
        const attendanceStats = await this.getFingerprintAttendanceStats(student.id)

        return view.render('pages/students/fingerprint-history', {
            student,
            fingerprints,
            fingerprintStats,
            attendanceStats,
            statusFilter,
            qualityFilter
        })
    }

    async faceRecognition({ params, view, request }: HttpContext) {
        const student = await Student.query()
            .where('id', params.id)
            .preload('class', (classQuery) => {
                classQuery.preload('teacher')
            })
            .preload('faceData', (faceQuery) => {
                faceQuery.orderBy('createdAt', 'desc')
            })
            .firstOrFail()

        const page = request.input('page', 1)
        const statusFilter = request.input('status', '')

        let faceAttendanceQuery = Attendance.query()
            .where('studentId', student.id)
            .whereNull('deviceId')
            .where('isManualEntry', false)
            .preload('schedule', (scheduleQuery) => {
                scheduleQuery.preload('class').preload('teacher')
            })

        if (statusFilter) {
            faceAttendanceQuery = faceAttendanceQuery.where('status', statusFilter)
        }

        const faceAttendances = await faceAttendanceQuery
            .orderBy('attendanceDate', 'desc')
            .paginate(page, 15)

        faceAttendances.baseUrl(`/students/${student.id}/face-history`)

        const faceStats = await this.getFaceRecognitionStats(student.id)

        return view.render('pages/students/face-history', {
            student,
            faceAttendances,
            faceStats,
            statusFilter
        })
    }

 async allHistory({ params, view, request }: HttpContext) {
    const student = await Student.query()
        .where('id', params.id)
        .preload('class', (classQuery) => {
            classQuery.preload('teacher')
        })
        .preload('fingerprints', (fingerprintQuery) => {
            fingerprintQuery.where('isActive', true)
        })
        .preload('faceData', (faceQuery) => {
            faceQuery.where('isActive', true)
        })
        .firstOrFail()

    const page = request.input('page', 1)
    const typeFilter = request.input('type', '')
    const dateFrom = request.input('date_from', '')
    const dateTo = request.input('date_to', '')

    let attendanceQuery = Attendance.query()
        .where('studentId', student.id)
        .preload('schedule', (scheduleQuery) => {
            scheduleQuery.preload('class').preload('teacher')
        })
        .preload('device')

    if (typeFilter === 'fingerprint') {
        attendanceQuery = attendanceQuery.whereNotNull('deviceId').where('isManualEntry', false)
    } else if (typeFilter === 'face') {
        attendanceQuery = attendanceQuery.whereNull('deviceId').where('isManualEntry', false)
    } else if (typeFilter === 'manual') {
        attendanceQuery = attendanceQuery.where('isManualEntry', true)
    }

    if (dateFrom) {
        attendanceQuery = attendanceQuery.where('attendanceDate', '>=', DateTime.fromFormat(dateFrom, 'yyyy-MM-dd'))
    }

    if (dateTo) {
        attendanceQuery = attendanceQuery.where('attendanceDate', '<=', DateTime.fromFormat(dateTo, 'yyyy-MM-dd'))
    }

    const attendances = await attendanceQuery
        .orderBy('attendanceDate', 'desc')
        .paginate(page, 20)

    attendances.baseUrl(`/students/${student.id}/all-history`)

    const allStats = await this.getAllHistoryStats(student.id, dateFrom, dateTo)

    return view.render('pages/students/all-history', {
        student,
        attendances,
        allStats,
        stats: allStats.attendance, // Add this line
        typeFilter,
        dateFrom,
        dateTo
    })
}

    private async getAttendanceStats(studentId: number, dateFrom?: string, dateTo?: string) {
        let query = Attendance.query().where('studentId', studentId)

        if (dateFrom) {
            query = query.where('attendanceDate', '>=', DateTime.fromFormat(dateFrom, 'yyyy-MM-dd'))
        }

        if (dateTo) {
            query = query.where('attendanceDate', '<=', DateTime.fromFormat(dateTo, 'yyyy-MM-dd'))
        }

        const total = await query.clone().count('* as total')
        const present = await query.clone().where('status', 'present').count('* as total')
        const late = await query.clone().where('status', 'late').count('* as total')
        const absent = await query.clone().where('status', 'absent').count('* as total')
        const excused = await query.clone().where('status', 'excused').count('* as total')
        const manual = await query.clone().where('isManualEntry', true).count('* as total')
        const fingerprint = await query.clone().whereNotNull('deviceId').where('isManualEntry', false).count('* as total')

        return {
            total: total[0].$extras.total,
            present: present[0].$extras.total,
            late: late[0].$extras.total,
            absent: absent[0].$extras.total,
            excused: excused[0].$extras.total,
            manual: manual[0].$extras.total,
            fingerprint: fingerprint[0].$extras.total,
            presentPercentage: total[0].$extras.total > 0 ? Math.round((present[0].$extras.total / total[0].$extras.total) * 100) : 0
        }
    }

    private async getFingerprintStats(studentId: number) {
        const total = await Fingerprint.query().where('studentId', studentId).count('* as total')
        const active = await Fingerprint.query().where('studentId', studentId).where('isActive', true).count('* as total')
        const avgQuality = await Fingerprint.query().where('studentId', studentId).avg('quality as avg')

        return {
            total: total[0].$extras.total,
            active: active[0].$extras.total,
            inactive: total[0].$extras.total - active[0].$extras.total,
            avgQuality: Math.round(avgQuality[0].$extras.avg || 0)
        }
    }

    private async getFingerprintAttendanceStats(studentId: number) {
        const fingerprintAttendances = await Attendance.query()
            .where('studentId', studentId)
            .whereNotNull('deviceId')
            .where('isManualEntry', false)
            .count('* as total')

        const lastFingerprintAttendance = await Attendance.query()
            .where('studentId', studentId)
            .whereNotNull('deviceId')
            .where('isManualEntry', false)
            .orderBy('attendanceDate', 'desc')
            .first()

        return {
            totalFingerprintAttendances: fingerprintAttendances[0].$extras.total,
            lastFingerprintAttendance: lastFingerprintAttendance?.attendanceDate
        }
    }

    private async getFaceRecognitionStats(studentId: number) {
        const faceData = await FaceData.query().where('studentId', studentId).count('* as total')
        const activeFaceData = await FaceData.query().where('studentId', studentId).where('isActive', true).count('* as total')
        const avgConfidence = await FaceData.query().where('studentId', studentId).avg('confidence as avg')

        const faceAttendances = await Attendance.query()
            .where('studentId', studentId)
            .whereNull('deviceId')
            .where('isManualEntry', false)
            .count('* as total')

        const lastFaceAttendance = await Attendance.query()
            .where('studentId', studentId)
            .whereNull('deviceId')
            .where('isManualEntry', false)
            .orderBy('attendanceDate', 'desc')
            .first()

        return {
            totalFaceData: faceData[0].$extras.total,
            activeFaceData: activeFaceData[0].$extras.total,
            avgConfidence: Math.round((avgConfidence[0].$extras.avg || 0) * 100),
            totalFaceAttendances: faceAttendances[0].$extras.total,
            lastFaceAttendance: lastFaceAttendance?.attendanceDate
        }
    }

private async getAllHistoryStats(studentId: number, dateFrom?: string, dateTo?: string) {
    const attendanceStats = await this.getAttendanceStats(studentId, dateFrom, dateTo)
    const fingerprintStats = await this.getFingerprintStats(studentId)
    const faceStats = await this.getFaceRecognitionStats(studentId)

    return {
        attendance: attendanceStats,
        fingerprint: fingerprintStats,
        face: faceStats
    }
}

async export({ params, request, response }: HttpContext) {
  const { type } = request.qs()
  
  try {
    const student = await Student.query()
      .where('id', params.id)
      .preload('class')
      .firstOrFail()
    
    let data: any[] = []
    let filename = ''
    
    switch (type) {
      case 'attendance':
        data = await this.getAttendanceExportData(student.id)
        filename = `riwayat-absensi-${student.studentId}-${DateTime.now().toFormat('yyyy-MM-dd')}.xlsx`
        break
        
      case 'fingerprint':
        data = await this.getFingerprintExportData(student.id)
        filename = `riwayat-fingerprint-${student.studentId}-${DateTime.now().toFormat('yyyy-MM-dd')}.xlsx`
        break
        
      case 'face':
        data = await this.getFaceExportData(student.id)
        filename = `riwayat-face-${student.studentId}-${DateTime.now().toFormat('yyyy-MM-dd')}.xlsx`
        break
        
      case 'all':
        data = await this.getAllExportData(student.id)
        filename = `riwayat-lengkap-${student.studentId}-${DateTime.now().toFormat('yyyy-MM-dd')}.xlsx`
        break
        
      default:
        return response.json({ 
          success: false, 
          message: 'Tipe export tidak valid' 
        })
    }
    
    if (data.length === 0) {
      return response.json({ 
        success: false, 
        message: 'Tidak ada data untuk diekspor' 
      })
    }
    

    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    // Set headers for file download
    response.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    response.header('Content-Length', buffer.length.toString())
    
    return response.send(buffer)
    
  } catch (error) {
    console.error('Export error:', error)
    return response.json({ 
      success: false, 
      message: `Gagal export data: ${error.message}` 
    })
  }
}

    private async getAttendanceExportData(studentId: number) {
        const attendances = await Attendance.query()
            .where('studentId', studentId)
            .preload('schedule', (scheduleQuery) => {
                scheduleQuery.preload('class').preload('teacher')
            })
            .preload('device')
            .orderBy('attendanceDate', 'desc')

        return attendances.map(attendance => ({
            'Tanggal': attendance.attendanceDate.toFormat('dd/MM/yyyy'),
            'Jam Masuk': attendance.checkInTime ? attendance.checkInTime.toFormat('HH:mm') : '-',
            'Jam Keluar': attendance.checkOutTime ? attendance.checkOutTime.toFormat('HH:mm') : '-',
            'Status': this.getStatusText(attendance.status),
            'Metode': attendance.isManualEntry ? 'Manual' : (attendance.device ? 'Fingerprint' : 'Face Recognition'),
            'Perangkat': attendance.device ? attendance.device.deviceName : '-',
            'Mata Pelajaran': attendance.schedule ? attendance.schedule.subject : '-',
            'Kelas': attendance.schedule ? attendance.schedule.class.name : '-',
            'Guru': attendance.schedule ? attendance.schedule.teacher.name : '-',
            'Keterangan': attendance.notes || '-'
        }))
    }

    private async getFingerprintExportData(studentId: number) {
        const fingerprints = await Fingerprint.query()
            .where('studentId', studentId)
            .orderBy('createdAt', 'desc')

        const fingerprintAttendances = await Attendance.query()
            .where('studentId', studentId)
            .whereNotNull('deviceId')
            .where('isManualEntry', false)
            .preload('device')
            .orderBy('attendanceDate', 'desc')

        const exportData = [
            // Fingerprint data section
            { 'Tipe': 'DATA FINGERPRINT', 'Info': '', 'Detail': '', 'Tanggal': '', 'Status': '' },
            ...fingerprints.map(fp => ({
                'Tipe': 'Fingerprint',
                'Info': `Jari ${fp.fingerIndex}`,
                'Detail': `Kualitas: ${fp.quality}%`,
                'Tanggal': fp.createdAt.toFormat('dd/MM/yyyy HH:mm'),
                'Status': fp.isActive ? 'Aktif' : 'Tidak Aktif'
            })),

            // Empty row
            { 'Tipe': '', 'Info': '', 'Detail': '', 'Tanggal': '', 'Status': '' },

            // Attendance data section
            { 'Tipe': 'ABSENSI VIA FINGERPRINT', 'Info': '', 'Detail': '', 'Tanggal': '', 'Status': '' },
            ...fingerprintAttendances.map(att => ({
                'Tipe': 'Absensi',
                'Info': att.device ? att.device.deviceName : '-',
                'Detail': att.checkInTime ? att.checkInTime.toFormat('HH:mm') : '-',
                'Tanggal': att.attendanceDate.toFormat('dd/MM/yyyy'),
                'Status': this.getStatusText(att.status)
            }))
        ]

        return exportData
    }

    private async getFaceExportData(studentId: number) {
        const faceData = await FaceData.query()
            .where('studentId', studentId)
            .orderBy('createdAt', 'desc')

        const faceAttendances = await Attendance.query()
            .where('studentId', studentId)
            .whereNull('deviceId')
            .where('isManualEntry', false)
            .orderBy('attendanceDate', 'desc')

        const exportData = [
            // Face data section
            { 'Tipe': 'DATA WAJAH', 'Info': '', 'Detail': '', 'Tanggal': '', 'Status': '' },
            ...faceData.map(face => ({
                'Tipe': 'Face Data',
                'Info': `Data #${face.id}`,
                'Detail': `Akurasi: ${Math.round(face.confidence * 100)}%`,
                'Tanggal': face.createdAt.toFormat('dd/MM/yyyy HH:mm'),
                'Status': face.isActive ? 'Aktif' : 'Tidak Aktif'
            })),

            // Empty row
            { 'Tipe': '', 'Info': '', 'Detail': '', 'Tanggal': '', 'Status': '' },

            // Attendance data section
            { 'Tipe': 'ABSENSI VIA FACE RECOGNITION', 'Info': '', 'Detail': '', 'Tanggal': '', 'Status': '' },
            ...faceAttendances.map(att => ({
                'Tipe': 'Absensi',
                'Info': 'Face Recognition',
                'Detail': att.checkInTime ? att.checkInTime.toFormat('HH:mm') : '-',
                'Tanggal': att.attendanceDate.toFormat('dd/MM/yyyy'),
                'Status': this.getStatusText(att.status)
            }))
        ]

        return exportData
    }

    private async getAllExportData(studentId: number) {
        const student = await Student.query()
            .where('id', studentId)
            .preload('class')
            .firstOrFail()

        const attendances = await this.getAttendanceExportData(studentId)
        const fingerprints = await this.getFingerprintExportData(studentId)
        const faces = await this.getFaceExportData(studentId)

        const exportData = [
            // Student info
            { 'Kategori': 'INFORMASI SISWA', 'Data': '', 'Detail': '', 'Keterangan': '' },
            { 'Kategori': 'Nama', 'Data': student.name, 'Detail': '', 'Keterangan': '' },
            { 'Kategori': 'NIS', 'Data': student.studentId, 'Detail': '', 'Keterangan': '' },
            { 'Kategori': 'Kelas', 'Data': student.class.name, 'Detail': '', 'Keterangan': '' },
            { 'Kategori': 'Email', 'Data': student.email, 'Detail': '', 'Keterangan': '' },

            // Empty row
            { 'Kategori': '', 'Data': '', 'Detail': '', 'Keterangan': '' },

            // Summary stats
            { 'Kategori': 'RINGKASAN', 'Data': '', 'Detail': '', 'Keterangan': '' },
            { 'Kategori': 'Total Absensi', 'Data': attendances.length.toString(), 'Detail': '', 'Keterangan': '' },
            { 'Kategori': 'Total Fingerprint', 'Data': fingerprints.filter(f => f.Tipe === 'Fingerprint').length.toString(), 'Detail': '', 'Keterangan': '' },
            { 'Kategori': 'Total Face Data', 'Data': faces.filter(f => f.Tipe === 'Face Data').length.toString(), 'Detail': '', 'Keterangan': '' },

            // Empty row
            { 'Kategori': '', 'Data': '', 'Detail': '', 'Keterangan': '' },

            // All attendance data
            { 'Kategori': 'DETAIL ABSENSI', 'Data': '', 'Detail': '', 'Keterangan': '' },
            ...attendances.map(att => ({
                'Kategori': 'Absensi',
                'Data': att.Tanggal,
                'Detail': `${att['Jam Masuk']} - ${att.Status}`,
                'Keterangan': `${att.Metode} - ${att['Mata Pelajaran']}`
            }))
        ]

        return exportData
    }

    private getStatusText(status: string): string {
        const statusMap: any = {
            'present': 'Hadir',
            'late': 'Terlambat',
            'absent': 'Tidak Hadir',
            'excused': 'Izin'
        }
        return statusMap[status] || status
    }
}