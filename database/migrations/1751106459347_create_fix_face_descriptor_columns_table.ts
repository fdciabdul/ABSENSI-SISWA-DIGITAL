import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'face_data'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('face_descriptor').alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('face_descriptor').alter()
    })
  }
}