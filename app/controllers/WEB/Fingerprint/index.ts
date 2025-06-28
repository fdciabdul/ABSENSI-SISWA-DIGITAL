import type { HttpContext } from '@adonisjs/core/http'
import FingerprintDevice from '#models/fingerprint_device'
import FingerprintService from '#services/fingerprint_service'
import Student from '#models/student'
import Fingerprint from '#models/fingerprint'

export default class FingerprintController {
  async index({ view }: HttpContext) {
    const devices = await FingerprintDevice.query()
      .preload('logs', (query) => {
        query.orderBy('createdAt', 'desc').limit(5)
      })
      .orderBy('deviceName', 'asc')

    return view.render('pages/fingerprint/index', { devices })
  }

  async connect({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const service = new FingerprintService(device)
      
      const connected = await service.connect()
      
      if (connected) {
        const info = await service.getDeviceInfo()
        await service.disconnect()
        
        session.flash('success', `Berhasil terhubung ke ${device.deviceName}`)
        return response.json({ success: true, info })
      } else {
        session.flash('error', `Gagal terhubung ke ${device.deviceName}`)
        return response.json({ success: false })
      }
    } catch (error) {
      session.flash('error', `Error: ${error.message}`)
      return response.json({ success: false, error: error.message })
    }
  }

  async syncUsers({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const service = new FingerprintService(device)
      
      await service.connect()
      await service.syncUsers()
      await service.disconnect()
      
      session.flash('success', 'Sinkronisasi pengguna berhasil')
      return response.json({ success: true })
    } catch (error) {
      session.flash('error', `Sinkronisasi gagal: ${error.message}`)
      return response.json({ success: false, error: error.message })
    }
  }

  async downloadLogs({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const service = new FingerprintService(device)
      
      await service.connect()
      const logs = await service.getAttendanceLogs()
      await service.disconnect()
      
      // Process logs and save to database
      // This would involve matching device user IDs to students
      // and creating attendance records
      
      session.flash('success', `Berhasil mengunduh ${logs.length} log absensi`)
      return response.json({ success: true, count: logs.length })
    } catch (error) {
      session.flash('error', `Download gagal: ${error.message}`)
      return response.json({ success: false, error: error.message })
    }
  }

  async startMonitoring({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const service = new FingerprintService(device)
      
      await service.connect()
      await service.startRealTimeMonitoring()
      
      session.flash('success', 'Monitoring real-time dimulai')
      return response.json({ success: true })
    } catch (error) {
      session.flash('error', `Monitoring gagal: ${error.message}`)
      return response.json({ success: false, error: error.message })
    }
  }

  async clearLogs({ params, response, session }: HttpContext) {
    try {
      const device = await FingerprintDevice.findOrFail(params.id)
      const service = new FingerprintService(device)
      
      await service.connect()
      await service.clearAttendanceLogs()
      await service.disconnect()
      
      session.flash('success', 'Log absensi berhasil dihapus dari perangkat')
      return response.json({ success: true })
    } catch (error) {
      session.flash('error', `Gagal menghapus log: ${error.message}`)
      return response.json({ success: false, error: error.message })
    }
  }

async enrollFingerprint({ request, response, session }: HttpContext) {
    try {
        const { studentId, deviceId, fingerIndex } = request.only(['studentId', 'deviceId', 'fingerIndex'])
        
        const student = await Student.findOrFail(studentId)
        const device = await FingerprintDevice.findOrFail(deviceId)
        
        // Check if finger already exists
        const existingFingerprint = await Fingerprint.query()
            .where('studentId', studentId)
            .where('fingerIndex', fingerIndex)
            .first()
            
        if (existingFingerprint) {
            return response.json({ success: false, message: 'Jari tersebut sudah terdaftar' })
        }
        
        const service = new FingerprintService(device)
        const connected = await service.connect()
        
        if (!connected) {
            return response.json({ success: false, message: 'Tidak dapat terhubung ke perangkat' })
        }
        
        // Start enrollment process
        const enrollmentId = `enroll_${Date.now()}_${studentId}_${fingerIndex}`
        
        // Store enrollment session in cache or database
        // For now, we'll simulate the enrollment process
        
        await service.disconnect()
        
        session.flash('info', 'Pendaftaran fingerprint dimulai. Ikuti instruksi pada perangkat.')
        return response.json({ 
            success: true, 
            message: 'Enrollment started',
            enrollmentId 
        })
    } catch (error) {
        return response.json({ success: false, message: error.message })
    }
}

async enrollmentStatus({ params, response }: HttpContext) {
    const { enrollmentId } = params
    
    // Simulate enrollment progress
    // In real implementation, this would check the actual device status
    const progress = Math.min(100, Math.floor(Math.random() * 100))
    const completed = progress >= 100
    
    return response.json({
        progress,
        status: completed ? 'Pendaftaran selesai' : 'Letakkan jari pada sensor...',
        completed,
        success: completed
    })
}

async deleteFingerprint({ params, response, session }: HttpContext) {
    try {
        const fingerprint = await Fingerprint.findOrFail(params.id)
        await fingerprint.delete()
        
        session.flash('success', 'Fingerprint berhasil dihapus')
        return response.json({ success: true })
    } catch (error) {
        session.flash('error', 'Gagal menghapus fingerprint')
        return response.json({ success: false, error: error.message })
    }
}
}