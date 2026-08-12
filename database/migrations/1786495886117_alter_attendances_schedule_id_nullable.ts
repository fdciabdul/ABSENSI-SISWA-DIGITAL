import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendances'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Face/fingerprint attendance has no schedule, so schedule_id must be nullable.
      // MySQL unique indexes allow multiple NULL values, so the existing unique key
      // (student_id, schedule_id, attendance_date) stays valid and schedule-less
      // check-ins will not collide with each other.
      table.integer('schedule_id').unsigned().nullable().alter()

      // Report queries filter/scan by attendance_date
      table.index('attendance_date')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('attendance_date')
      table.integer('schedule_id').unsigned().notNullable().alter()
    })
  }
}
