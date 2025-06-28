import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { DateTime } from 'luxon'


export default class AuthController {
  async showLogin({ view, auth, response }: HttpContext) {
    if (await auth.check()) {
      return response.redirect('/dashboard')
    }
    return view.render('pages/auth/login')
  }

  async login({ request, auth, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    console.log('Login attempt:', { email, password })
    
    try {   
      const user = await User.verifyCredentials(email, password)
      
      if (!user.isActive) {
        session.flash('error', 'Your account has been deactivated')
        return response.redirect().back()
      }

      await auth.use('web').login(user)
      
      user.lastLoginAt = DateTime.now()
      await user.save()

      return response.redirect('/dashboard')
    } catch (error) {
      console.log('Login error:', error)
      session.flash('error', 'Invalid email or password')
      return response.redirect().back()
    }
  }

  async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.clear()
    return response.redirect().toRoute('auth.login')
  }
}