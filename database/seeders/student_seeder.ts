import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Student from '#models/student'

export default class extends BaseSeeder {
  async run() {
    await Student.createMany([
      {
        studentId: 'STD001',
        name: 'Ahmad Rizki',
        email: 'ahmad.rizki@student.com',
        phone: '08111111111',
        classId: 1,
        gradeLevel: '10',
        isActive: true
      },
      {
        studentId: 'STD002',
        name: 'Budi Santoso',
        email: 'budi.santoso@student.com',
        phone: '08111111112',
        classId: 1,
        gradeLevel: '10',
        isActive: true
      },
      {
        studentId: 'STD003',
        name: 'Deni Kurniawan',
        email: 'deni.kurniawan@student.com',
        phone: '08111111113',
        classId: 2,
        gradeLevel: '10',
        isActive: true
      },
      {
        studentId: 'STD004',
        name: 'Eko Prasetyo',
        email: 'eko.prasetyo@student.com',
        phone: '08111111114',
        classId: 2,
        gradeLevel: '10',
        isActive: true
      },
      {
        studentId: 'STD005',
        name: 'Fajar Ramadhan',
        email: 'fajar.ramadhan@student.com',
        phone: '08111111115',
        classId: 3,
        gradeLevel: '11',
        isActive: true
      }
    ])
  }
}