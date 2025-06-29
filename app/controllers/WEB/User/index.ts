import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { DateTime } from 'luxon'


export default class UserController {
     async index({ view, request }: HttpContext) {
        const user = await User.all();
        
     }
}