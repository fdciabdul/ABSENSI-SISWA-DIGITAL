import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendances'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('student_id').unsigned().references('students.id').onDelete('CASCADE')
      table.integer('schedule_id').unsigned().references('schedules.id').onDelete('CASCADE')
      table.integer('device_id').unsigned().nullable().references('fingerprint_devices.id')
      table.enum('status', ['present', 'absent', 'late', 'excused']).notNullable()
      table.timestamp('check_in_time').nullable()
      table.timestamp('check_out_time').nullable()
      table.date('attendance_date').notNullable()
      table.text('notes').nullable()
      table.boolean('is_manual_entry').defaultTo(false)
      table.integer('entered_by').unsigned().nullable().references('users.id')
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      table.unique(['student_id', 'schedule_id', 'attendance_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}