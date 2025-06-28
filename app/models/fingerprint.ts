import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Student from '#models/student'

export default class Fingerprint extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare studentId: number

  @column()
  declare fingerprintTemplate: string

  @column()
  declare fingerIndex: number

  @column()
  declare quality: number

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Student)
  declare student: BelongsTo<typeof Student>
}