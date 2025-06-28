import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Student from '#models/student'
import Schedule from '#models/schedule'
import Teacher from '#models/teacher'

export default class Class extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare gradeLevel: string

  @column()
  declare teacherId: number

  @column()
  declare academicYear: string

  @column()
  declare maxStudents: number

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Student)
  declare students: HasMany<typeof Student>

  @hasMany(() => Schedule)
  declare schedules: HasMany<typeof Schedule>

  @belongsTo(() => Teacher)
  declare teacher: BelongsTo<typeof Teacher>
}