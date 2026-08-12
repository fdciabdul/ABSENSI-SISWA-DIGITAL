import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

/**
 * ApiKey middleware is used to protect API routes consumed by
 * external services (e.g. the Python face recognition app) by
 * requiring a matching "x-api-key" header.
 */
export default class ApiKeyMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const apiKey = request.header('x-api-key')

    if (!apiKey || apiKey !== env.get('FACE_API_KEY')) {
      return response.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid API key',
      })
    }

    return next()
  }
}
