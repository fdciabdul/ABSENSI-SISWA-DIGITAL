import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import FingerprintDevice from '#models/fingerprint_device'

export default class DeviceLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare deviceId: number

  @column()
  declare action: string

  @column()
  declare message: string

  @column()
  declare level: 'info' | 'warning' | 'error' | 'debug'

  @column()
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => FingerprintDevice, {
    foreignKey: 'deviceId'
  })
  declare device: BelongsTo<typeof FingerprintDevice>
}