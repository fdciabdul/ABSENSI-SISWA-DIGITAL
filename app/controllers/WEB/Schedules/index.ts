import type { HttpContext } from '@adonisjs/core/http'
import Schedule from '#models/schedule'
import Class from '#models/class'
import Teacher from '#models/teacher'

export default class SchedulesController {
  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const classFilter = request.input('class', '')
    const dayFilter = request.input('day', '')
    const teacherFilter = request.input('teacher', '')

    let query = Schedule.query()
      .preload('class')
      .preload('teacher')

    if (classFilter) {
      query = query.where('classId', classFilter)
    }

    if (dayFilter) {
      query = query.where('dayOfWeek', dayFilter)
    }

    if (teacherFilter) {
      query = query.where('teacherId', teacherFilter)
    }

    const schedules = await query
      .where('isActive', true)
      .orderBy('dayOfWeek', 'asc')
      .orderBy('startTime', 'asc')
      .paginate(page, 20)

    const classes = await Class.query()
      .where('isActive', true)
      .orderBy('name', 'asc')

    const teachers = await Teacher.query()
      .where('isActive', true)
      .orderBy('name', 'asc')

    // Get weekly schedule for display
    const weeklySchedule = await this.getWeeklySchedule(classFilter)

    return view.render('pages/schedules/index', {
      schedules,
      classes,
      teachers,
      classFilter,
      dayFilter,
      teacherFilter,
      weeklySchedule
    })
  }

  async create({ view }: HttpContext) {
    const classes = await Class.query()
      .where('isActive', true)
      .orderBy('name', 'asc')

    const teachers = await Teacher.query()
      .where('isActive', true)
      .orderBy('name', 'asc')

    return view.render('pages/schedules/create', { classes, teachers })
  }

  async store({ request, response, session }: HttpContext) {
    try {
      const data = request.only([
        'classId',
        'teacherId',
        'subject',
        'dayOfWeek',
        'startTime',
        'endTime',
        'room'
      ])

      // Check for time conflicts
      const conflict = await Schedule.query()
        .where('classId', data.classId)
        .where('dayOfWeek', data.dayOfWeek)
        .where('isActive', true)
        .where((builder) => {
          builder
            .whereBetween('startTime', [data.startTime, data.endTime])
            .orWhereBetween('endTime', [data.startTime, data.endTime])
            .orWhere((subBuilder) => {
              subBuilder
                .where('startTime', '<=', data.startTime)
                .where('endTime', '>=', data.endTime)
            })
        })
        .first()

      if (conflict) {
        session.flash('error', 'Terdapat bentrok jadwal pada waktu yang sama')
        return response.redirect().back()
      }

      await Schedule.create({
        ...data,
        isActive: true
      })

      session.flash('success', 'Jadwal berhasil ditambahkan')
      return response.redirect().toRoute('schedules.index')
    } catch (error) {
      session.flash('error', 'Gagal menambahkan jadwal')
      return response.redirect().back()
    }
  }

  async show({ params, view }: HttpContext) {
    const schedule = await Schedule.query()
      .where('id', params.id)
      .preload('class', (classQuery) => {
        classQuery.preload('students')
      })
      .preload('teacher')
      .firstOrFail()

    return view.render('pages/schedules/show', { schedule })
  }

  async edit({ params, view }: HttpContext) {
    const schedule = await Schedule.findOrFail(params.id)
    
    const classes = await Class.query()
      .where('isActive', true)
      .orderBy('name', 'asc')

    const teachers = await Teacher.query()
      .where('isActive', true)
      .orderBy('name', 'asc')

    return view.render('pages/schedules/edit', { schedule, classes, teachers })
  }

  async update({ params, request, response, session }: HttpContext) {
    try {
      const schedule = await Schedule.findOrFail(params.id)
      const data = request.only([
        'classId',
        'teacherId',
        'subject',
        'dayOfWeek',
        'startTime',
        'endTime',
        'room',
        'isActive'
      ])

      // Check for time conflicts (excluding current schedule)
      const conflict = await Schedule.query()
        .where('classId', data.classId)
        .where('dayOfWeek', data.dayOfWeek)
        .where('isActive', true)
        .whereNot('id', params.id)
        .where((builder) => {
          builder
            .whereBetween('startTime', [data.startTime, data.endTime])
            .orWhereBetween('endTime', [data.startTime, data.endTime])
            .orWhere((subBuilder) => {
              subBuilder
                .where('startTime', '<=', data.startTime)
                .where('endTime', '>=', data.endTime)
            })
        })
        .first()

      if (conflict) {
        session.flash('error', 'Terdapat bentrok jadwal pada waktu yang sama')
        return response.redirect().back()
      }

      await schedule.merge(data).save()

      session.flash('success', 'Jadwal berhasil diperbarui')
      return response.redirect().toRoute('schedules.index')
    } catch (error) {
      session.flash('error', 'Gagal memperbarui jadwal')
      return response.redirect().back()
    }
  }

  async destroy({ params, response, session }: HttpContext) {
    try {
      const schedule = await Schedule.findOrFail(params.id)
      await schedule.delete()

      session.flash('success', 'Jadwal berhasil dihapus')
      return response.redirect().toRoute('schedules.index')
    } catch (error) {
      session.flash('error', 'Gagal menghapus jadwal')
      return response.redirect().back()
    }
  }

  private async getWeeklySchedule(classFilter?: string) {
    let query = Schedule.query()
      .preload('class')
      .preload('teacher')
      .where('isActive', true)

    if (classFilter) {
      query = query.where('classId', classFilter)
    }

    const schedules = await query
      .orderBy('dayOfWeek', 'asc')
      .orderBy('startTime', 'asc')

    // Group by day
    const weeklySchedule: { [key: number]: any[] } = {
      1: [], // Monday
      2: [], // Tuesday
      3: [], // Wednesday
      4: [], // Thursday
      5: [], // Friday
      6: [], // Saturday
      7: []  // Sunday
    }

    schedules.forEach(schedule => {
      weeklySchedule[schedule.dayOfWeek].push(schedule)
    })

    return weeklySchedule
  }
}