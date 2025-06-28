import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fingerprints'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('student_id').unsigned().references('students.id').onDelete('CASCADE')
      table.text('fingerprint_template').notNullable()
      table.integer('finger_index').notNullable()
      table.integer('quality').notNullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      table.unique(['student_id', 'finger_index'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}