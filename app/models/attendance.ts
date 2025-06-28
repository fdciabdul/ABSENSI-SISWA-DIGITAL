import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Student from '#models/student'
import Schedule from '#models/schedule'
import FingerprintDevice from '#models/fingerprint_device'

export default class Attendance extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare studentId: number

  @column()
  declare scheduleId: number

  @column()
  declare deviceId: number | null

  @column()
  declare status: 'present' | 'absent' | 'late' | 'excused'

  @column.dateTime()
  declare checkInTime: DateTime | null

  @column.dateTime()
  declare checkOutTime: DateTime | null

  @column.dateTime()
  declare attendanceDate: DateTime

  @column()
  declare notes: string | null

  @column()
  declare isManualEntry: boolean

  @column()
  declare enteredBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Student, {
    foreignKey: 'studentId'
  })
  declare student: BelongsTo<typeof Student>

  @belongsTo(() => Schedule, {
    foreignKey: 'scheduleId'
  })
  declare schedule: BelongsTo<typeof Schedule>

  @belongsTo(() => FingerprintDevice, {
    foreignKey: 'deviceId'
  })
  declare device: BelongsTo<typeof FingerprintDevice>
}