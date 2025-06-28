import type { HttpContext } from '@adonisjs/core/http'
import Student from '#models/student'
import Attendance from '#models/attendance'
import FingerprintDevice from '#models/fingerprint_device'
import Class from '#models/class'
import Teacher from '#models/teacher'
import { DateTime } from 'luxon'
import Database from '@adonisjs/lucid/services/db'

export default class DashboardController {
  async index({ view, auth }: HttpContext) {
    const user = auth.user!
    const today = DateTime.now()
    const startOfDay = today.startOf('day')
    const startOfWeek = today.startOf('week')
    const startOfMonth = today.startOf('month')

    // Basic Stats
    const totalStudents = await Student.query().where('isActive', true).count('* as total')
    const totalClasses = await Class.query().where('isActive', true).count('* as total')
    const totalTeachers = await Teacher.query().where('isActive', true).count('* as total')
    const totalDevices = await FingerprintDevice.query().where('isActive', true).count('* as total')

    // Today's Attendance
    const todayAttendance = await Attendance.query()
      .whereBetween('attendanceDate', [startOfDay.toSQL(), today.endOf('day').toSQL()])
      .count('* as total')
    
    const presentToday = await Attendance.query()
      .whereBetween('attendanceDate', [startOfDay.toSQL(), today.endOf('day').toSQL()])
      .whereIn('status', ['present', 'late'])
      .count('* as total')

    const lateToday = await Attendance.query()
      .whereBetween('attendanceDate', [startOfDay.toSQL(), today.endOf('day').toSQL()])
      .where('status', 'late')
      .count('* as total')

    const absentToday = await Attendance.query()
      .whereBetween('attendanceDate', [startOfDay.toSQL(), today.endOf('day').toSQL()])
      .where('status', 'absent')
      .count('* as total')

    // Device Status
    const devicesOnline = await FingerprintDevice.query().where('isOnline', true).count('* as total')
    const devicesOffline = await FingerprintDevice.query().where('isOnline', false).count('* as total')

    // Weekly Trends
    const weeklyAttendance = await this.getWeeklyAttendanceData(startOfWeek)
    
    // Monthly Stats
    const monthlyAttendance = await Attendance.query()
      .where('attendanceDate', '>=', startOfMonth.toSQL())
      .count('* as total')

    // Top Classes by Attendance Rate
    const topClasses = await this.getTopClassesByAttendance()

    // Recent Attendance
    const recentAttendance = await Attendance.query()
      .preload('student', (studentQuery) => {
        studentQuery.preload('class')
      })
      .preload('device')
      .whereBetween('attendanceDate', [startOfDay.toSQL(), today.endOf('day').toSQL()])
      .orderBy('checkInTime', 'desc')
      .whereNotNull('checkInTime')
      .limit(10)

    // Late Students Today
    const lateStudentsToday = await Attendance.query()
      .preload('student', (studentQuery) => {
        studentQuery.preload('class')
      })
      .whereBetween('attendanceDate', [startOfDay.toSQL(), today.endOf('day').toSQL()])
      .where('status', 'late')
      .orderBy('checkInTime', 'desc')
      .limit(5)

    // Absent Students Today
    const absentStudentsToday = await Attendance.query()
      .preload('student', (studentQuery) => {
        studentQuery.preload('class')
      })
      .whereBetween('attendanceDate', [startOfDay.toSQL(), today.endOf('day').toSQL()])
      .where('status', 'absent')
      .limit(5)

    // Device Activity
    const deviceActivity = await FingerprintDevice.query()
      .preload('attendances', (attendanceQuery) => {
        attendanceQuery.whereBetween('attendanceDate', [startOfDay.toSQL(), today.endOf('day').toSQL()])
      })
      .where('isActive', true)
      .orderBy('deviceName')

    // Calculate attendance rate
    const attendanceRate = totalStudents[0].$extras.total > 0 
      ? Math.round((presentToday[0].$extras.total / totalStudents[0].$extras.total) * 100) 
      : 0

    // Get hourly attendance distribution
    const hourlyDistribution = await this.getHourlyAttendanceDistribution(startOfDay)

    return view.render('pages/dashboard/index', {
      user,
      stats: {
        totalStudents: totalStudents[0].$extras.total,
        totalClasses: totalClasses[0].$extras.total,
        totalTeachers: totalTeachers[0].$extras.total,
        totalDevices: totalDevices[0].$extras.total,
        todayAttendance: todayAttendance[0].$extras.total,
        presentToday: presentToday[0].$extras.total,
        lateToday: lateToday[0].$extras.total,
        absentToday: absentToday[0].$extras.total,
        devicesOnline: devicesOnline[0].$extras.total,
        devicesOffline: devicesOffline[0].$extras.total,
        monthlyAttendance: monthlyAttendance[0].$extras.total,
        attendanceRate
      },
      weeklyAttendance,
      topClasses,
      recentAttendance,
      lateStudentsToday,
      absentStudentsToday,
      deviceActivity,
      hourlyDistribution
    })
  }

  private async getWeeklyAttendanceData(startOfWeek: DateTime) {
    const weekData = []
    
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.plus({ days: i })
      const dayName = day.toFormat('ccc')
      
      const dayAttendance = await Attendance.query()
        .whereBetween('attendanceDate', [day.startOf('day').toSQL(), day.endOf('day').toSQL()])
        .select('status')
        .count('* as count')
        .groupBy('status')

      const statusCounts = {
        present: 0,
        late: 0,
        absent: 0,
        excused: 0
      }

      dayAttendance.forEach(item => {
        statusCounts[item.status] = item.$extras.count
      })

      weekData.push({
        day: dayName,
        date: day.toFormat('dd/MM'),
        ...statusCounts,
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
      })
    }

    return weekData
  }

  private async getTopClassesByAttendance() {
    const classes = await Class.query()
      .preload('students', (studentQuery) => {
        studentQuery.where('isActive', true)
          .preload('attendances', (attendanceQuery) => {
            attendanceQuery.where('attendanceDate', '>=', DateTime.now().startOf('month').toSQL())
              .whereIn('status', ['present', 'late'])
          })
      })
      .where('isActive', true)
      .limit(5)

    return classes.map(classItem => {
      const totalStudents = classItem.students.length
      const totalAttendances = classItem.students.reduce((sum, student) => sum + student.attendances.length, 0)
      const attendanceRate = totalStudents > 0 ? Math.round((totalAttendances / (totalStudents * DateTime.now().day)) * 100) : 0

      return {
        id: classItem.id,
        name: classItem.name,
        totalStudents,
        totalAttendances,
        attendanceRate
      }
    }).sort((a, b) => b.attendanceRate - a.attendanceRate)
  }

  private async getHourlyAttendanceDistribution(startOfDay: DateTime) {
    try {
      // First, let's check if there's any data for today
      const hasData = await Attendance.query()
        .whereBetween('attendanceDate', [startOfDay.toSQL(), startOfDay.plus({ days: 1 }).toSQL()])
        .whereNotNull('checkInTime')
        .count('* as total')

      if (hasData[0].$extras.total === 0) {
        // Return empty distribution if no data
        return []
      }

      // Use the correct column name based on your attendance model
      const hourlyData = await Database.rawQuery(`
        SELECT 
          HOUR(check_in_time) as hour,
          COUNT(*) as count
        FROM attendances 
        WHERE attendance_date >= ? 
          AND attendance_date < ?
          AND check_in_time IS NOT NULL
        GROUP BY HOUR(check_in_time)
        ORDER BY hour
      `, [startOfDay.toSQL(), startOfDay.plus({ days: 1 }).toSQL()])

      const distribution = Array.from({ length: 24 }, (_, hour) => ({
        hour: hour.toString().padStart(2, '0') + ':00',
        count: 0
      }))

      hourlyData[0].forEach(item => {
        if (item.hour >= 0 && item.hour < 24) {
          distribution[item.hour].count = item.count
        }
      })

      return distribution.filter(item => item.count > 0)
    } catch (error) {
      console.error('Error getting hourly distribution:', error)
      // Return empty array if there's an error
      return []
    }
  }
}