import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'face_data'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('student_id').unsigned().references('students.id').onDelete('CASCADE')
      table.json('face_descriptor').notNullable()
      table.boolean('is_active').defaultTo(true)
      table.decimal('confidence', 5, 2).defaultTo(0)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['student_id', 'is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}