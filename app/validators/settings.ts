import vine from '@vinejs/vine'

export const settingsValidator = vine.compile(
  vine.object({
    notifications: vine.object({
      email: vine.boolean().optional(),
      desktop: vine.boolean().optional(),
      attendance: vine.boolean().optional()
    }).optional(),
    theme: vine.enum(['light', 'dark']).optional(),
    language: vine.enum(['id', 'en']).optional(),
    timezone: vine.string().optional()
  })
)