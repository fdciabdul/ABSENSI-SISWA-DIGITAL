import type { HttpContext } from '@adonisjs/core/http'
import Attendance from '#models/attendance'
import Student from '#models/student'
import Class from '#models/class'
import Schedule from '#models/schedule'
import { DateTime } from 'luxon'

export default class AttendanceController {
    async index({ view, request }: HttpContext) {
        const page = request.input('page', 1)
        const date = request.input('date', '')
        const classFilter = request.input('class', '')
        const status = request.input('status', '')

        let query = Attendance.query()
            .preload('student', (studentQuery) => {
                studentQuery.preload('class')
            })
            .preload('schedule', (scheduleQuery) => {
                scheduleQuery.preload('class')
            })

     
        if (date && date.trim() !== '') {
            console.log('Filtering by date:', date)
            query = query.whereRaw('DATE(attendance_date) = ?', [date])
        }

        if (classFilter) {
            query = query.whereHas('student', (studentQuery) => {
                studentQuery.where('classId', classFilter)
            })
        }

        if (status) {
            query = query.where('status', status)
        }

        const attendances = await query
            .orderBy('attendanceDate', 'desc')
            .orderBy('createdAt', 'desc')
            .paginate(page, 25)

        const classes = await Class.query()
            .where('isActive', true)
            .orderBy('name', 'asc')


    
        return view.render('pages/attendance/index', {
            attendances,
            classes,
            date: date || DateTime.now().toFormat('yyyy-MM-dd'),
            classFilter,
            status
        })
    }

    async create({ view }: HttpContext) {
        const classes = await Class.query()
            .where('isActive', true)
            .preload('students', (studentQuery) => {
                studentQuery.where('isActive', true)
            })
            .orderBy('name', 'asc')

        const schedules = await Schedule.query()
            .preload('class')
            .where('isActive', true)
            .orderBy('startTime', 'asc')

        return view.render('pages/attendance/create', { classes, schedules })
    }

    async store({ request, response, session }: HttpContext) {
        try {
            const data = request.only([
                'studentId',
                'scheduleId',
                'status',
                'attendanceDate',
                'checkInTime',
                'notes'
            ])

            const attendanceDate = DateTime.fromFormat(data.attendanceDate, 'yyyy-MM-dd')

            await Attendance.create({
                ...data,
                attendanceDate: attendanceDate,
                checkInTime: data.checkInTime ? DateTime.fromISO(data.checkInTime) : null,
                isManualEntry: true
            })

            session.flash('success', 'Data absensi berhasil ditambahkan')
            return response.redirect().toRoute('attendance.index')
        } catch (error) {
            session.flash('error', 'Gagal menambahkan data absensi')
            return response.redirect().back()
        }
    }

    async edit({ params, view }: HttpContext) {
        const attendance = await Attendance.query()
            .where('id', params.id)
            .preload('student')
            .preload('schedule', (scheduleQuery) => {
                scheduleQuery.preload('class')
            })
            .firstOrFail()

        const classes = await Class.query()
            .where('isActive', true)
            .orderBy('name', 'asc')

        return view.render('pages/attendance/edit', { attendance, classes })
    }

    async update({ params, request, response, session }: HttpContext) {
        try {
            const attendance = await Attendance.findOrFail(params.id)
            const data = request.only([
                'status',
                'checkInTime',
                'checkOutTime',
                'notes'
            ])

            await attendance.merge({
                ...data,
                checkInTime: data.checkInTime ? DateTime.fromISO(data.checkInTime) : null,
                checkOutTime: data.checkOutTime ? DateTime.fromISO(data.checkOutTime) : null
            }).save()

            session.flash('success', 'Data absensi berhasil diperbarui')
            return response.redirect().toRoute('attendance.index')
        } catch (error) {
            session.flash('error', 'Gagal memperbarui data absensi')
            return response.redirect().back()
        }
    }

    async destroy({ params, response, session }: HttpContext) {
        try {
            const attendance = await Attendance.findOrFail(params.id)
            await attendance.delete()

            session.flash('success', 'Data absensi berhasil dihapus')
            return response.redirect().toRoute('attendance.index')
        } catch (error) {
            session.flash('error', 'Gagal menghapus data absensi')
            return response.redirect().back()
        }
    }

    async bulkCreate({ view }: HttpContext) {
        const classes = await Class.query()
            .where('isActive', true)
            .preload('students', (studentQuery) => {
                studentQuery.where('isActive', true)
            })
            .orderBy('name', 'asc')

        const today = DateTime.now().toFormat('yyyy-MM-dd')

        return view.render('pages/attendance/bulk', { classes, today })
    }

    async bulkStore({ request, response, session }: HttpContext) {
        try {
            const { classId, attendanceDate, attendanceData } = request.only([
                'classId', 'attendanceDate', 'attendanceData'
            ])

            const parsedData = JSON.parse(attendanceData)
            let created = 0

            for (const item of parsedData) {
                await Attendance.create({
                    studentId: item.studentId,
                    status: item.status,
                    attendanceDate: DateTime.fromFormat(attendanceDate, 'yyyy-MM-dd'),
                    checkInTime: item.checkInTime ? DateTime.fromISO(item.checkInTime) : null,
                    notes: item.notes || null,
                    isManualEntry: true
                })
                created++
            }

            session.flash('success', `Berhasil menyimpan ${created} data absensi`)
            return response.redirect().toRoute('attendance.index')
        } catch (error) {
            session.flash('error', 'Gagal menyimpan data absensi')
            return response.redirect().back()
        }
    }
}