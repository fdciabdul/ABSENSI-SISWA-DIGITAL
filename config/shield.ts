import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more
   */
  csp: {
    enabled: false,
    directives: {},
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
    enabled: true,
    exceptRoutes: [
      // API routes for Python app (no CSRF needed)
      '/api/face-recognition/data',
      '/api/face-recognition/attendance', 
      '/api/face-recognition/register',
      '/api/students',
      
      // Fingerprint API routes (if you have external devices calling these)
      '/fingerprint/*/connect',
      '/fingerprint/*/sync-users', 
      '/fingerprint/*/download-logs',
      '/fingerprint/*/start-monitoring',
      '/fingerprint/*/clear-logs',
      '/fingerprint/enroll',
      '/fingerprint/enrollment-status/*',
    ],
    enableXsrfCookie: false,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS
   */
  hsts: {
    enabled: true,
    maxAge: '180 days',
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
