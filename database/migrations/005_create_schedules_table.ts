import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'schedules'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('class_id').unsigned().references('classes.id').onDelete('CASCADE')
      table.integer('teacher_id').unsigned().references('teachers.id').onDelete('CASCADE')
      table.string('subject').notNullable()
      table.integer('day_of_week').notNullable()
      table.time('start_time').notNullable()
      table.time('end_time').notNullable()
      table.string('room').notNullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}