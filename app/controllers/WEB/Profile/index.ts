import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { profileUpdateValidator, passwordChangeValidator } from '#validators/profile'

export default class ProfileController {
  async index({ auth, view }: HttpContext) {
    const user = auth.user!


    return view.render('pages/profile/index', { user })
  }

  async update({ auth, request, response, session }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(profileUpdateValidator)

      // Check if email is being changed and if it's already taken
      if (payload.email !== user.email) {
        const existingUser = await User.findBy('email', payload.email)
        if (existingUser) {
          session.flash('error', 'Email sudah digunakan oleh pengguna lain')
          return response.redirect().back()
        }
      }

      user.merge(payload)
      await user.save()

      session.flash('success', 'Profil berhasil diperbarui')
      return response.redirect().toRoute('profile.index')
    } catch (error) {
      session.flash('error', 'Gagal memperbarui profil')
      return response.redirect().back()
    }
  }

  async changePassword({ auth, request, response, session }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(passwordChangeValidator)

      // Verify current password
      const isCurrentPasswordValid = await hash.verify(user.password, payload.currentPassword)
      if (!isCurrentPasswordValid) {
        session.flash('error', 'Password saat ini tidak valid')
        return response.redirect().back()
      }

      // Update password
      user.password = payload.newPassword
      await user.save()

      session.flash('success', 'Password berhasil diubah')
      return response.redirect().toRoute('profile.index')
    } catch (error) {
      session.flash('error', 'Gagal mengubah password')
      return response.redirect().back()
    }
  }

  async uploadAvatar({ auth, request, response, session }: HttpContext) {
    try {
      const user = auth.user!
      const avatar = request.file('avatar', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png']
      })

      if (!avatar) {
        session.flash('error', 'Pilih file foto profil')
        return response.redirect().back()
      }

      if (!avatar.isValid) {
        session.flash('error', avatar.errors[0].message)
        return response.redirect().back()
      }

      // Save avatar (you might want to use a cloud storage service)
      const fileName = `${user.id}_${Date.now()}.${avatar.extname}`
      await avatar.move('uploads/avatars', {
        name: fileName
      })

      // You can save the avatar path to user model if you add an avatar column
      // user.avatar = `/uploads/avatars/${fileName}`
      // await user.save()

      session.flash('success', 'Foto profil berhasil diupload')
      return response.redirect().toRoute('profile.index')
    } catch (error) {
      session.flash('error', 'Gagal mengupload foto profil')
      return response.redirect().back()
    }
  }
}