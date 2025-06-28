import type { HttpContext } from '@adonisjs/core/http'
import Teacher from '#models/teacher'

export default class TeachersController {
  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const subject = request.input('subject', '')
    const status = request.input('status', '')

    let query = Teacher.query()
      .preload('classes', (classQuery) => {
        classQuery.where('isActive', true)
      })
      .preload('schedules', (scheduleQuery) => {
        scheduleQuery.where('isActive', true)
      })

    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'LIKE', `%${search}%`)
          .orWhere('employeeId', 'LIKE', `%${search}%`)
          .orWhere('email', 'LIKE', `%${search}%`)
      })
    }

    if (subject) {
      query = query.where('subject', 'LIKE', `%${subject}%`)
    }

    if (status === 'active') {
      query = query.where('isActive', true)
    } else if (status === 'inactive') {
      query = query.where('isActive', false)
    }

    const teachers = await query
      .orderBy('name', 'asc')
      .paginate(page, 15)

    return view.render('pages/teachers/index', {
      teachers,
      search,
      subject,
      status
    })
  }

  async create({ view }: HttpContext) {
    return view.render('pages/teachers/create')
  }

  async store({ request, response, session }: HttpContext) {
    try {
      const data = request.only([
        'employeeId',
        'name',
        'email',
        'phone',
        'subject'
      ])

      await Teacher.create({
        ...data,
        isActive: true
      })

      session.flash('success', 'Data guru berhasil ditambahkan')
      return response.redirect().toRoute('teachers.index')
    } catch (error) {
      session.flash('error', 'Gagal menambahkan data guru')
      return response.redirect().back()
    }
  }

  async show({ params, view }: HttpContext) {
    const teacher = await Teacher.query()
      .where('id', params.id)
      .preload('classes', (classQuery) => {
        classQuery.where('isActive', true).orderBy('name', 'asc')
      })
      .preload('schedules', (scheduleQuery) => {
        scheduleQuery
          .where('isActive', true)
          .preload('class')
          .orderBy('dayOfWeek', 'asc')
          .orderBy('startTime', 'asc')
      })
      .firstOrFail()

    return view.render('pages/teachers/show', { teacher })
  }

  async edit({ params, view }: HttpContext) {
    const teacher = await Teacher.findOrFail(params.id)
    return view.render('pages/teachers/edit', { teacher })
  }

  async update({ params, request, response, session }: HttpContext) {
    try {
      const teacher = await Teacher.findOrFail(params.id)
      const data = request.only([
        'employeeId',
        'name',
        'email',
        'phone',
        'subject',
        'isActive'
      ])

      await teacher.merge(data).save()

      session.flash('success', 'Data guru berhasil diperbarui')
      return response.redirect().toRoute('teachers.index')
    } catch (error) {
      session.flash('error', 'Gagal memperbarui data guru')
      return response.redirect().back()
    }
  }

  async destroy({ params, response, session }: HttpContext) {
    try {
      const teacher = await Teacher.findOrFail(params.id)
      
      await teacher.load('classes')
      await teacher.load('schedules')
      
      if (teacher.classes.length > 0 || teacher.schedules.length > 0) {
        session.flash('error', 'Tidak dapat menghapus guru yang masih memiliki kelas atau jadwal')
        return response.redirect().back()
      }

      await teacher.delete()
      
      session.flash('success', 'Data guru berhasil dihapus')
      return response.redirect().toRoute('teachers.index')
    } catch (error) {
      session.flash('error', 'Gagal menghapus data guru')
      return response.redirect().back()
    }
  }
}