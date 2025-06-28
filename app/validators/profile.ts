import vine from '@vinejs/vine'

export const profileUpdateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100),
    email: vine.string().trim().email().normalizeEmail(),
    phone: vine.string().trim().optional(),
    employeeId: vine.string().trim().optional()
  })
)

export const passwordChangeValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(6),
    newPassword: vine.string().minLength(6).confirmed()
  })
)