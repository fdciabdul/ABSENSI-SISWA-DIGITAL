import type { HttpContext } from '@adonisjs/core/http'
import Class from '#models/class'
import Teacher from '#models/teacher'

export default class ClassesController {
  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const gradeLevel = request.input('gradeLevel', '')
    const status = request.input('status', '')

    let query = Class.query()
      .preload('teacher')
      .preload('students', (studentQuery) => {
        studentQuery.where('isActive', true)
      })

    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'LIKE', `%${search}%`)
          .orWhere('academicYear', 'LIKE', `%${search}%`)
      })
    }

    if (gradeLevel) {
      query = query.where('gradeLevel', gradeLevel)
    }

    if (status === 'active') {
      query = query.where('isActive', true)
    } else if (status === 'inactive') {
      query = query.where('isActive', false)
    }

    const classes = await query
      .orderBy('gradeLevel', 'asc')
      .orderBy('name', 'asc')
      .paginate(page, 15)

    return view.render('pages/classes/index', {
      classes,
      search,
      gradeLevel,
      status
    })
  }

  async create({ view }: HttpContext) {
    const teachers = await Teacher.query()
      .where('isActive', true)
      .orderBy('name', 'asc')

    return view.render('pages/classes/create', { teachers })
  }

  async store({ request, response, session }: HttpContext) {
    try {
      const data = request.only([
        'name',
        'gradeLevel',
        'teacherId',
        'academicYear',
        'maxStudents'
      ])

      await Class.create({
        ...data,
        isActive: true
      })

      session.flash('success', 'Data kelas berhasil ditambahkan')
      return response.redirect().toRoute('classes.index')
    } catch (error) {
      session.flash('error', 'Gagal menambahkan data kelas')
      return response.redirect().back()
    }
  }

  async show({ params, view }: HttpContext) {
    const classData = await Class.query()
      .where('id', params.id)
      .preload('teacher')
      .preload('students', (studentQuery) => {
        studentQuery.where('isActive', true).orderBy('name', 'asc')
      })
      .preload('schedules', (scheduleQuery) => {
        scheduleQuery.where('isActive', true).orderBy('dayOfWeek', 'asc').orderBy('startTime', 'asc')
      })
      .firstOrFail()

    return view.render('pages/classes/show', { classData })
  }

  async edit({ params, view }: HttpContext) {
    const classData = await Class.findOrFail(params.id)
    const teachers = await Teacher.query()
      .where('isActive', true)
      .orderBy('name', 'asc')

    return view.render('pages/classes/edit', { classData, teachers })
  }

  async update({ params, request, response, session }: HttpContext) {
    try {
      const classData = await Class.findOrFail(params.id)
      const data = request.only([
        'name',
        'gradeLevel',
        'teacherId',
        'academicYear',
        'maxStudents',
        'isActive'
      ])

      await classData.merge(data).save()

      session.flash('success', 'Data kelas berhasil diperbarui')
      return response.redirect().toRoute('classes.index')
    } catch (error) {
      session.flash('error', 'Gagal memperbarui data kelas')
      return response.redirect().back()
    }
  }

  async destroy({ params, response, session }: HttpContext) {
    try {
      const classData = await Class.findOrFail(params.id)
      
      await classData.load('students')
      if (classData.students.length > 0) {
        session.flash('error', 'Tidak dapat menghapus kelas yang masih memiliki siswa')
        return response.redirect().back()
      }

      await classData.delete()
      
      session.flash('success', 'Data kelas berhasil dihapus')
      return response.redirect().toRoute('classes.index')
    } catch (error) {
      session.flash('error', 'Gagal menghapus data kelas')
      return response.redirect().back()
    }
  }
}