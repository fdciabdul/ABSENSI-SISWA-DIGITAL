import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Student from '#models/student'

export default class FaceData extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare studentId: number

  @column({
    serialize: (value: number[]) => {
      return value
    },
    prepare: (value: number[]) => {
      return JSON.stringify(value)
    },
    consume: (value: string | number[]) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return value || []
    }
  })
  declare faceDescriptor: number[]

  @column()
  declare isActive: boolean

  @column()
  declare confidence: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Student, {
    foreignKey: 'studentId'
  })
  declare student: BelongsTo<typeof Student>
}