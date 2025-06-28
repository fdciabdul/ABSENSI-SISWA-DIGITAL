import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fingerprint_devices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('device_name').notNullable()
      table.string('serial_number').notNullable().unique()
      table.string('ip_address').notNullable()
      table.integer('port').defaultTo(4370)
      table.string('location').notNullable()
      table.boolean('is_online').defaultTo(false)
      table.timestamp('last_sync_at').nullable()
      table.string('device_model').notNullable()
      table.string('firmware_version').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}