import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Class from '#models/class'
import Teacher from '#models/teacher'
import Attendance from '#models/attendance'

export default class Schedule extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare classId: number

  @column()
  declare teacherId: number

  @column()
  declare subject: string

  @column()
  declare dayOfWeek: number

  @column()
  declare startTime: string

  @column()
  declare endTime: string

  @column()
  declare room: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Class)
  declare class: BelongsTo<typeof Class>

  @belongsTo(() => Teacher)
  declare teacher: BelongsTo<typeof Teacher>

  @hasMany(() => Attendance)
  declare attendances: HasMany<typeof Attendance>
}