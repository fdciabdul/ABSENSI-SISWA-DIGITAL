import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import env from '#start/env'
import { randomBytes } from 'node:crypto'

export default class extends BaseSeeder {
  async run() {
    let password = env.get('SEED_ADMIN_PASSWORD')

    if (!password) {
      password = randomBytes(12).toString('base64url')
      console.log(`SEED_ADMIN_PASSWORD tidak diset, password acak dibuat: ${password}`)
    }

    await User.createMany([
      {
        name: 'Super Admin',
        email: 'admin@school.com',
        password,
        role: 'admin',
        employeeId: 'ADM001',
        phone: '08123456789',
        isActive: true
      },
      {
        name: 'John Teacher',
        email: 'john@school.com',
        password,
        role: 'teacher',
        employeeId: 'TCH001',
        phone: '08123456790',
        isActive: true
      },
      {
        name: 'Jane Staff',
        email: 'jane@school.com',
        password,
        role: 'staff',
        employeeId: 'STF001',
        phone: '08123456791',
        isActive: true
      }
    ])
  }
}