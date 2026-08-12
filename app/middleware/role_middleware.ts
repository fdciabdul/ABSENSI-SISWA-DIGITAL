import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Role middleware is used to restrict access to routes based on
 * the authenticated user's role. Pass the allowed roles as
 * options, e.g. middleware.role(['admin'])
 */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, roles: string[]) {
    const user = ctx.auth.user

    if (!user || !roles.includes(user.role)) {
      return ctx.response.forbidden({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
      })
    }

    return next()
  }
}
