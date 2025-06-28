import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Teacher from '#models/teacher'

export default class extends BaseSeeder {
  async run() {
    await Teacher.createMany([
      {
        employeeId: 'TCH001',
        name: 'Ahmad Sutanto',
        email: 'ahmad.sutanto@school.com',
        phone: '08123456790',
        subject: 'Mathematics',
        isActive: true
      },
      {
        employeeId: 'TCH002',
        name: 'Budi Wijaya',
        email: 'budi.wijaya@school.com',
        phone: '08123456792',
        subject: 'English',
        isActive: true
      },
      {
        employeeId: 'TCH003',
        name: 'Deni Pratama',
        email: 'deni.pratama@school.com',
        phone: '08123456793',
        subject: 'Science',
        isActive: true
      }
    ])
  }
}