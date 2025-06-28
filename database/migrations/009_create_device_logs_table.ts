import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'device_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('device_id').unsigned().references('fingerprint_devices.id').onDelete('CASCADE')
      table.string('action').notNullable()
      table.text('message').notNullable()
      table.enum('level', ['info', 'warning', 'error', 'debug']).notNullable()
      table.json('metadata').nullable()
      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}