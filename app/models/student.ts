import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Attendance from '#models/attendance'
import Fingerprint from '#models/fingerprint'
import FaceData from '#models/face_data'
import Class from '#models/class'

export default class Student extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare studentId: string

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column()
  declare classId: number

  @column()
  declare gradeLevel: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Class)
  declare class: BelongsTo<typeof Class>

  @hasMany(() => Attendance)
  declare attendances: HasMany<typeof Attendance>

  @hasMany(() => Fingerprint)
  declare fingerprints: HasMany<typeof Fingerprint>

  @hasMany(() => FaceData)
  declare faceData: HasMany<typeof FaceData>
}