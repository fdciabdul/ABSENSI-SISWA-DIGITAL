import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'students'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('student_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('email').notNullable().unique()
      table.string('phone').nullable()
      table.integer('class_id').unsigned().references('classes.id').onDelete('CASCADE')
      table.string('grade_level').notNullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}