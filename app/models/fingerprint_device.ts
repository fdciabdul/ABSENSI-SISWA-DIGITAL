import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Attendance from '#models/attendance'
import DeviceLog from '#models/device_log'

export default class FingerprintDevice extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare deviceName: string

  @column()
  declare serialNumber: string

  @column()
  declare ipAddress: string

  @column()
  declare port: number

  @column()
  declare location: string

  @column()
  declare isOnline: boolean

  @column.dateTime()
  declare lastSyncAt: DateTime | null

  @column()
  declare deviceModel: string

  @column()
  declare firmwareVersion: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Attendance, {
    foreignKey: 'deviceId'
  })
  declare attendances: HasMany<typeof Attendance>

  @hasMany(() => DeviceLog, {
    foreignKey: 'deviceId'
  })
  declare logs: HasMany<typeof DeviceLog>
}