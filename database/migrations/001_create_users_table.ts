import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.enum('role', ['admin', 'teacher', 'staff']).notNullable()
      table.string('employee_id').nullable().unique()
      table.string('phone').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('last_login_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}