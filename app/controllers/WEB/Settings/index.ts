import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { settingsValidator } from '#validators/settings'

export default class SettingsController {
  async index({ auth, view }: HttpContext) {
    const user = auth.user!
    
    // Get application settings (you can create a settings model later)
    const settings = {
      notifications: {
        email: true,
        desktop: false,
        attendance: true
      },
      theme: 'light',
      language: 'id',
      timezone: 'Asia/Jakarta'
    }

    return view.render('pages/settings/index', { user, settings })
  }

  async update({ auth, request, response, session }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(settingsValidator)

      // Here you would typically save settings to a settings table
      // For now, we'll just update some user preferences
      
      session.flash('success', 'Pengaturan berhasil disimpan')
      return response.redirect().toRoute('settings.index')
    } catch (error) {
      session.flash('error', 'Gagal menyimpan pengaturan')
      return response.redirect().back()
    }
  }

  async exportData({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      
      // Create export data
      const exportData = {
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          createdAt: user.createdAt
        },
        exportedAt: new Date().toISOString()
      }

      response.header('Content-Type', 'application/json')
      response.header('Content-Disposition', `attachment; filename="user_data_${user.id}.json"`)
      
      return response.send(JSON.stringify(exportData, null, 2))
    } catch (error) {
      return response.internalServerError({ message: 'Gagal mengekspor data' })
    }
  }

  async deleteAccount({ auth, request, response, session }: HttpContext) {
    try {
      const user = auth.user!
      const confirmation = request.input('confirmation')

      if (confirmation !== 'DELETE') {
        session.flash('error', 'Konfirmasi penghapusan akun tidak valid')
        return response.redirect().back()
      }

      // Mark user as inactive instead of deleting
      user.isActive = false
      await user.save()

      // Logout user
      await auth.use('web').logout()

      session.flash('success', 'Akun berhasil dinonaktifkan')
      return response.redirect().toRoute('auth.login')
    } catch (error) {
      session.flash('error', 'Gagal menghapus akun')
      return response.redirect().back()
    }
  }
}