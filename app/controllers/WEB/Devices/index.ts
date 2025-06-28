import type { HttpContext } from '@adonisjs/core/http'
import FingerprintDevice from '#models/fingerprint_device'
import FingerprintService from '#services/fingerprint_service'
import { DateTime } from 'luxon'

export default class DevicesController {
  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const status = request.input('status', '')
    const location = request.input('location', '')

    let query = FingerprintDevice.query()
      .preload('logs', (logQuery) => {
        logQuery.orderBy('createdAt', 'desc').limit(5)
      })

    if (search) {
      query = query.where((builder) => {
        builder
          .where('deviceName', 'LIKE', `%${search}%`)
          .orWhere('serialNumber', 'LIKE', `%${search}%`)
          .orWhere('ipAddress', 'LIKE', `%${search}%`)
      })
    }

    if (location) {
      query = query.where('location', 'LIKE', `%${location}%`)
    }

    if (status === 'online') {
      query = query.where('isOnline', true)
    } else if (status === 'offline') {
      query = query.where('isOnline', false)
    } else if (status === 'active') {
      query = query.where('isActive', true)
    } else if (status === 'inactive') {
      query = query.where('isActive', false)
    }

    const devices = await query
      .orderBy('deviceName', 'asc')
      .paginate(page, 12)

    return view.render('pages/devices/index', {
      devices,
      search,
      status,
      location
    })
  }

  async create({ view }: HttpContext) {
    return view.render('pages/devices/create')
  }

  async store({ request, response, session }: HttpContext) {
    try {
      const data = request.only([
        'deviceName',
        'serialNumber',
        'ipAddress',
        'port',
        'location',
        'deviceModel',
        'firmwareVersion'
      ])

      await FingerprintDevice.create({
        ...data,
        isActive: true,
        isOnline: false
      })

      session.flash('success', 'Perangkat berhasil ditambahkan')
      return response.redirect().toRoute('devices.index')
    } catch (error) {
      session.flash('error', 'Gagal menambahkan perangkat')
      return response.redirect().back()
    }
  }

  async show({ params, view }: HttpContext) {
    const device = await FingerprintDevice.query()
      .where('id', params.id)
      .preload('logs', (logQuery) => {
        logQuery.orderBy('createdAt', 'desc').limit(20)
      })
      .preload('attendances', (attendanceQuery) => {
        attendanceQuery
          .preload('student')
          .orderBy('createdAt', 'desc')
          .limit(10)
      })
      .firstOrFail()

    return view.render('pages/devices/show', { device })
  }

  async edit({ params, view }: HttpContext) {
    const device = await FingerprintDevice.findOrFail(params.id)
    return view.render('pages/devices/edit', { device })
  }

  async update({ params, request, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const data = request.only([
        'deviceName',
        'serialNumber',
        'ipAddress',
        'port',
        'location',
        'deviceModel',
        'firmwareVersion',
        'isActive'
      ])

      await device.merge(data).save()

      session.flash('success', 'Data perangkat berhasil diperbarui')
      return response.redirect().toRoute('devices.show', { id: device.id })
    } catch (error) {
      session.flash('error', 'Gagal memperbarui data perangkat')
      return response.redirect().back()
    }
  }

  async destroy({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      
      await device.load('attendances')
      if (device.attendances.length > 0) {
        session.flash('error', 'Tidak dapat menghapus perangkat yang memiliki data absensi')
        return response.redirect().back()
      }

      await device.delete()
      
      session.flash('success', 'Perangkat berhasil dihapus')
      return response.redirect().toRoute('devices.index')
    } catch (error) {
      session.flash('error', 'Gagal menghapus perangkat')
      return response.redirect().back()
    }
  }

  async connect({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const fingerprintService = new FingerprintService(device)
      
      const connected = await fingerprintService.connect()
      
      if (connected) {
        session.flash('success', 'Berhasil terhubung ke perangkat')
      } else {
        session.flash('error', 'Gagal terhubung ke perangkat')
      }
      
      await fingerprintService.disconnect()
      return response.redirect().back()
    } catch (error) {
      session.flash('error', `Gagal terhubung: ${error.message}`)
      return response.redirect().back()
    }
  }

  async disconnect({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const fingerprintService = new FingerprintService(device)
      
      await fingerprintService.disconnect()
      session.flash('success', 'Perangkat berhasil diputus koneksinya')
      
      return response.redirect().back()
    } catch (error) {
      session.flash('error', `Gagal memutus koneksi: ${error.message}`)
      return response.redirect().back()
    }
  }

  async syncUsers({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const fingerprintService = new FingerprintService(device)
      
      const connected = await fingerprintService.connect()
      if (!connected) {
        session.flash('error', 'Gagal terhubung ke perangkat')
        return response.redirect().back()
      }

      await fingerprintService.syncUsers()
      await fingerprintService.disconnect()
      
      session.flash('success', 'Sinkronisasi user berhasil')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', `Sinkronisasi gagal: ${error.message}`)
      return response.redirect().back()
    }
  }

  async syncAttendance({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const fingerprintService = new FingerprintService(device)
      
      const connected = await fingerprintService.connect()
      if (!connected) {
        session.flash('error', 'Gagal terhubung ke perangkat')
        return response.redirect().back()
      }

      const logs = await fingerprintService.getAttendanceLogs()
      await fingerprintService.disconnect()
      
      session.flash('success', `Berhasil mengambil ${logs.length} log absensi`)
      return response.redirect().back()
    } catch (error) {
      session.flash('error', `Sinkronisasi absensi gagal: ${error.message}`)
      return response.redirect().back()
    }
  }

  async clearLogs({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const fingerprintService = new FingerprintService(device)
      
      const connected = await fingerprintService.connect()
      if (!connected) {
        session.flash('error', 'Gagal terhubung ke perangkat')
        return response.redirect().back()
      }

      await fingerprintService.clearAttendanceLogs()
      await fingerprintService.disconnect()
      
      session.flash('success', 'Log absensi perangkat berhasil dibersihkan')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', `Gagal membersihkan log: ${error.message}`)
      return response.redirect().back()
    }
  }
}