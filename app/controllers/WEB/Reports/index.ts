import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Attendance from '#models/attendance'
import Student from '#models/student'
import Class from '#models/class'
import FingerprintDevice from '#models/fingerprint_device'
import ExcelJS from 'exceljs'
import Database from '@adonisjs/lucid/services/db'

export default class ReportsController {
  async index({ view }: HttpContext) {
    const today = DateTime.now()
    const startOfMonth = today.startOf('month')
    const startOfWeek = today.startOf('week')

    const totalStudents = await Student.query().where('isActive', true).count('* as total')
    const totalClasses = await Class.query().where('isActive', true).count('* as total')
    const totalDevices = await FingerprintDevice.query().where('isActive', true).count('* as total')
    const onlineDevices = await FingerprintDevice.query()
      .where('isActive', true)
      .where('isOnline', true)
      .count('* as total')

    const todayAttendance = await Attendance.query()
      .where('attendanceDate', '>=', today.startOf('day').toSQL())
      .where('attendanceDate', '<', today.plus({ days: 1 }).startOf('day').toSQL())
      .count('* as total')

    const weeklyAttendance = await Attendance.query()
      .where('attendanceDate', '>=', startOfWeek.toSQL())
      .count('* as total')

    const monthlyAttendance = await Attendance.query()
      .where('attendanceDate', '>=', startOfMonth.toSQL())
      .count('* as total')

    const attendanceRate = await this.calculateAttendanceRate(today)

    return view.render('pages/reports/index', {
      stats: {
        totalStudents: totalStudents[0].$extras.total,
        totalClasses: totalClasses[0].$extras.total,
        totalDevices: totalDevices[0].$extras.total,
        onlineDevices: onlineDevices[0].$extras.total,
        todayAttendance: todayAttendance[0].$extras.total,
        weeklyAttendance: weeklyAttendance[0].$extras.total,
        monthlyAttendance: monthlyAttendance[0].$extras.total,
        attendanceRate
      }
    })
  }

async attendance({ view, request }: HttpContext) {
  console.log('Attendance report request:', request.all())
  
  // Handle array values - take the first element if it's an array
  const startDateInput = request.input('start_date')
  const endDateInput = request.input('end_date')
  const classIdInput = request.input('class_id')
  const statusInput = request.input('status')

  const startDate = Array.isArray(startDateInput) ? startDateInput[0] : startDateInput || DateTime.now().startOf('month').toFormat('yyyy-MM-dd')
  const endDate = Array.isArray(endDateInput) ? endDateInput[0] : endDateInput || DateTime.now().toFormat('yyyy-MM-dd')
  const classId = Array.isArray(classIdInput) ? classIdInput[0] : classIdInput || ''
  const status = Array.isArray(statusInput) ? statusInput[0] : statusInput || ''

  console.log('Processed filters:', { startDate, endDate, classId, status })

  let query = Attendance.query()
    .preload('student', (studentQuery) => {
      studentQuery.preload('class')
    })
    .preload('device')
    .whereBetween('attendanceDate', [
      DateTime.fromFormat(startDate, 'yyyy-MM-dd').startOf('day').toSQL(),
      DateTime.fromFormat(endDate, 'yyyy-MM-dd').endOf('day').toSQL()
    ])

  if (classId && classId.trim() !== '') {
    query = query.whereHas('student', (studentQuery) => {
      studentQuery.where('classId', parseInt(classId))
    })
  }

  if (status && status.trim() !== '') {
    query = query.where('status', status)
  }

  const attendances = await query.orderBy('attendanceDate', 'desc').paginate(request.input('page', 1), 50)
  const classes = await Class.query().where('isActive', true).orderBy('name')

  return view.render('pages/reports/attendance', {
    attendances,
    classes,
    filters: { startDate, endDate, classId, status }
  })
}

  async students({ view, request }: HttpContext) {
    const classId = request.input('class_id', '')
    const status = request.input('status', '')

    let query = Student.query()
      .preload('class')
      .preload('attendances', (attendanceQuery) => {
        attendanceQuery.where('attendanceDate', '>=', DateTime.now().startOf('month').toSQL())
      })

    if (classId) {
      query = query.where('classId', classId)
    }

    if (status) {
      query = query.where('isActive', status === 'active')
    }

    const students = await query.orderBy('name').paginate(request.input('page', 1), 50)
    const classes = await Class.query().where('isActive', true).orderBy('name')

    return view.render('pages/reports/students', {
      students,
      classes,
      filters: { classId, status }
    })
  }

  async classes({ view }: HttpContext) {
    const classes = await Class.query()
      .preload('teacher')
      .preload('students', (studentQuery) => {
        studentQuery.where('isActive', true)
      })
      .preload('schedules', (scheduleQuery) => {
        scheduleQuery.where('isActive', true)
      })
      .where('isActive', true)
      .orderBy('gradeLevel')
      .orderBy('name')

    return view.render('pages/reports/classes', { classes })
  }

  async devices({ view }: HttpContext) {
    const devices = await FingerprintDevice.query()
      .preload('attendances', (attendanceQuery) => {
        attendanceQuery.where('attendanceDate', '>=', DateTime.now().startOf('month').toSQL())
      })
      .preload('logs', (logQuery) => {
        logQuery.orderBy('createdAt', 'desc').limit(10)
      })
      .orderBy('deviceName')

    return view.render('pages/reports/devices', { devices })
  }

  async exportAttendance({ request, response }: HttpContext) {
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')
    const classId = request.input('class_id')

    let query = Attendance.query()
      .preload('student', (studentQuery) => {
        studentQuery.preload('class')
      })
      .preload('device')
      .where('attendanceDate', '>=', startDate)
      .where('attendanceDate', '<=', endDate)

    if (classId) {
      query = query.whereHas('student', (studentQuery) => {
        studentQuery.where('classId', classId)
      })
    }

    const attendances = await query.orderBy('attendanceDate', 'desc')

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan Absensi')

    worksheet.mergeCells('A1:H1')
    worksheet.getCell('A1').value = 'LAPORAN ABSENSI SISWA'
    worksheet.getCell('A1').font = { size: 16, bold: true }
    worksheet.getCell('A1').alignment = { horizontal: 'center' }

    worksheet.mergeCells('A2:H2')
    worksheet.getCell('A2').value = `Periode: ${DateTime.fromISO(startDate).toFormat('dd/MM/yyyy')} - ${DateTime.fromISO(endDate).toFormat('dd/MM/yyyy')}`
    worksheet.getCell('A2').alignment = { horizontal: 'center' }

    worksheet.addRow([])

    const headers = ['No', 'Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Status', 'Jam Masuk', 'Perangkat']
    const headerRow = worksheet.addRow(headers)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    }
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true }

    attendances.forEach((attendance, index) => {
      worksheet.addRow([
        index + 1,
        attendance.attendanceDate.toFormat('dd/MM/yyyy'),
        attendance.student.studentId,
        attendance.student.name,
        attendance.student.class.name,
        this.getStatusText(attendance.status),
        attendance.checkInTime ? attendance.checkInTime.toFormat('HH:mm:ss') : '-',
        attendance.device ? attendance.device.deviceName : 'Manual'
      ])
    })

    worksheet.columns.forEach(column => {
      column.width = 15
    })

    response.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.header('Content-Disposition', `attachment; filename=laporan_absensi_${DateTime.now().toFormat('yyyyMMdd')}.xlsx`)

    return response.stream(await workbook.xlsx.writeBuffer())
  }

  async exportStudents({ request, response }: HttpContext) {
    const classId = request.input('class_id')

    let query = Student.query()
      .preload('class')
      .preload('attendances', (attendanceQuery) => {
        attendanceQuery.where('attendanceDate', '>=', DateTime.now().startOf('month').toSQL())
      })

    if (classId) {
      query = query.where('classId', classId)
    }

    const students = await query.orderBy('name')

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan Siswa')

    worksheet.mergeCells('A1:G1')
    worksheet.getCell('A1').value = 'LAPORAN DATA SISWA'
    worksheet.getCell('A1').font = { size: 16, bold: true }
    worksheet.getCell('A1').alignment = { horizontal: 'center' }

    worksheet.addRow([])

    const headers = ['No', 'NIS', 'Nama', 'Email', 'Kelas', 'Total Absensi Bulan Ini', 'Status']
    const headerRow = worksheet.addRow(headers)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' }
    }
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true }

    students.forEach((student, index) => {
      worksheet.addRow([
        index + 1,
        student.studentId,
        student.name,
        student.email,
        student.class.name,
        student.attendances.length,
        student.isActive ? 'Aktif' : 'Tidak Aktif'
      ])
    })

    worksheet.columns.forEach(column => {
      column.width = 18
    })

    response.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.header('Content-Disposition', `attachment; filename=laporan_siswa_${DateTime.now().toFormat('yyyyMMdd')}.xlsx`)

    return response.stream(await workbook.xlsx.writeBuffer())
  }

  async exportClasses({ response }: HttpContext) {
    const classes = await Class.query()
      .preload('teacher')
      .preload('students', (studentQuery) => {
        studentQuery.where('isActive', true)
      })
      .where('isActive', true)
      .orderBy('gradeLevel')
      .orderBy('name')

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan Kelas')

    worksheet.mergeCells('A1:H1')
    worksheet.getCell('A1').value = 'LAPORAN DATA KELAS'
    worksheet.getCell('A1').font = { size: 16, bold: true }
    worksheet.getCell('A1').alignment = { horizontal: 'center' }

    worksheet.addRow([])

    const headers = ['No', 'Nama Kelas', 'Tingkat', 'Wali Kelas', 'Tahun Akademik', 'Jumlah Siswa', 'Kapasitas', 'Utilisasi']
    const headerRow = worksheet.addRow(headers)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDC2626' }
    }
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true }

    classes.forEach((classItem, index) => {
      const utilization = Math.round((classItem.students.length / classItem.maxStudents) * 100)
      worksheet.addRow([
        index + 1,
        classItem.name,
        `Kelas ${classItem.gradeLevel}`,
        classItem.teacher.name,
        classItem.academicYear,
        classItem.students.length,
        classItem.maxStudents,
        `${utilization}%`
      ])
    })

    worksheet.columns.forEach(column => {
      column.width = 16
    })

    response.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.header('Content-Disposition', `attachment; filename=laporan_kelas_${DateTime.now().toFormat('yyyyMMdd')}.xlsx`)

    return response.stream(await workbook.xlsx.writeBuffer())
  }

  async attendanceChartData({ request, response }: HttpContext) {
    const days = parseInt(request.input('days', '7'))
    const endDate = DateTime.now()
    const startDate = endDate.minus({ days: days - 1 })

    // Use raw SQL to fix the date issue
    const data = await Database.rawQuery(`
      SELECT DATE(attendanceDate) as attendanceDate, status, COUNT(*) as count
      FROM attendances 
      WHERE attendanceDate >= ? AND attendanceDate <= ?
      GROUP BY DATE(attendanceDate), status
      ORDER BY DATE(attendanceDate)
    `, [startDate.startOf('day').toSQL(), endDate.endOf('day').toSQL()])

    const chartData = this.processAttendanceChartData(data[0], startDate, endDate)
    return response.json(chartData)
  }

  async classPerformanceData({ response }: HttpContext) {
    const classes = await Class.query()
      .preload('students', (studentQuery) => {
        studentQuery.where('isActive', true)
          .preload('attendances', (attendanceQuery) => {
            attendanceQuery.where('attendanceDate', '>=', DateTime.now().startOf('month').toSQL())
          })
      })
      .where('isActive', true)

    const data = classes.map(classItem => {
      const totalStudents = classItem.students.length
      const totalAttendances = classItem.students.reduce((sum, student) => sum + student.attendances.length, 0)
      const averageAttendance = totalStudents > 0 ? Math.round(totalAttendances / totalStudents) : 0

      return {
        className: classItem.name,
        totalStudents,
        averageAttendance,
        attendanceRate: totalStudents > 0 ? Math.round((totalAttendances / (totalStudents * DateTime.now().day)) * 100) : 0
      }
    })

    return response.json(data)
  }

  async monthlyTrendsData({ response }: HttpContext) {
    const months = []
    const currentDate = DateTime.now()

    for (let i = 11; i >= 0; i--) {
      const month = currentDate.minus({ months: i })
      months.push({
        month: month.toFormat('MMM yyyy'),
        startDate: month.startOf('month').toSQL(),
        endDate: month.endOf('month').toSQL()
      })
    }

    const data = await Promise.all(
      months.map(async (month) => {
        const attendanceCount = await Attendance.query()
          .where('attendanceDate', '>=', month.startDate)
          .where('attendanceDate', '<=', month.endDate)
          .count('* as total')

        return {
          month: month.month,
          total: attendanceCount[0].$extras.total
        }
      })
    )

    return response.json(data)
  }

  private async calculateAttendanceRate(date: DateTime): Promise<number> {
    const totalStudents = await Student.query().where('isActive', true).count('* as total')
    const presentToday = await Attendance.query()
      .where('attendanceDate', '>=', date.startOf('day').toSQL())
      .where('attendanceDate', '<', date.plus({ days: 1 }).startOf('day').toSQL())
      .whereIn('status', ['present', 'late'])
      .count('* as total')

    const total = totalStudents[0].$extras.total
    const present = presentToday[0].$extras.total

    return total > 0 ? Math.round((present / total) * 100) : 0
  }

  private processAttendanceChartData(data: any[], startDate: DateTime, endDate: DateTime) {
    const dates = []
    let current = startDate

    while (current <= endDate) {
      dates.push(current.toFormat('yyyy-MM-dd'))
      current = current.plus({ days: 1 })
    }

    const statusCounts = {
      present: dates.map(date => 0),
      late: dates.map(date => 0),
      absent: dates.map(date => 0),
      excused: dates.map(date => 0)
    }

    data.forEach(item => {
      const date = DateTime.fromJSDate(new Date(item.attendanceDate)).toFormat('yyyy-MM-dd')
      const index = dates.indexOf(date)
      if (index !== -1 && statusCounts[item.status]) {
        statusCounts[item.status][index] = parseInt(item.count)
      }
    })

    return {
      categories: dates.map(date => DateTime.fromISO(date).toFormat('dd/MM')),
      series: [
        { name: 'Hadir', data: statusCounts.present },
        { name: 'Terlambat', data: statusCounts.late },
        { name: 'Tidak Hadir', data: statusCounts.absent },
        { name: 'Izin', data: statusCounts.excused }
      ]
    }
  }

  private getStatusText(status: string): string {
    const statusMap = {
      present: 'Hadir',
      late: 'Terlambat',
      absent: 'Tidak Hadir',
      excused: 'Izin'
    }
    return statusMap[status] || status
  }
}