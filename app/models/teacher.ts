import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Class from '#models/class'
import Schedule from '#models/schedule'

export default class Teacher extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare employeeId: string

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column()
  declare subject: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Class)
  declare classes: HasMany<typeof Class>

  @hasMany(() => Schedule)
  declare schedules: HasMany<typeof Schedule>
}