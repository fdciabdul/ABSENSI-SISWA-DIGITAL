import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Class from '#models/class'

export default class extends BaseSeeder {
  async run() {
    await Class.createMany([
      {
        name: '10A',
        gradeLevel: '10',
        teacherId: 1,
        academicYear: '2024/2025',
        maxStudents: 30,
        isActive: true
      },
      {
        name: '10B',
        gradeLevel: '10',
        teacherId: 2,
        academicYear: '2024/2025',
        maxStudents: 30,
        isActive: true
      },
      {
        name: '11A',
        gradeLevel: '11',
        teacherId: 3,
        academicYear: '2024/2025',
        maxStudents: 28,
        isActive: true
      }
    ])
  }
}