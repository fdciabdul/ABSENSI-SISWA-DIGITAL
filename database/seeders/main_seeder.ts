import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserSeeder from '#database/seeders/user_seeder'
import TeacherSeeder from '#database/seeders/teacher_seeder'
import ClassSeeder from '#database/seeders/class_seeder'
import StudentSeeder from '#database/seeders/student_seeder'
import FingerprintDeviceSeeder from '#database/seeders/fingerprint_device_seeder'

export default class extends BaseSeeder {
  async run() {
    await new UserSeeder(this.client).run()
    await new TeacherSeeder(this.client).run()
    await new ClassSeeder(this.client).run()
    await new StudentSeeder(this.client).run()
    await new FingerprintDeviceSeeder(this.client).run()
  }
}