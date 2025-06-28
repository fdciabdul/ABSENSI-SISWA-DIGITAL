import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        name: 'Super Admin',
        email: 'admin@school.com',
        password: 'password123',
        role: 'admin',
        employeeId: 'ADM001',
        phone: '08123456789',
        isActive: true
      },
      {
        name: 'John Teacher',
        email: 'john@school.com',
        password: 'password123',
        role: 'teacher',
        employeeId: 'TCH001',
        phone: '08123456790',
        isActive: true
      },
      {
        name: 'Jane Staff',
        email: 'jane@school.com',
        password: 'password123',
        role: 'staff',
        employeeId: 'STF001',
        phone: '08123456791',
        isActive: true
      }
    ])
  }
}