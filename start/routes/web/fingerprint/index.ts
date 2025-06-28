import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const FingerprintController = () => import('#controllers/WEB/Fingerprint/index')

router.group(() => {
    router.get('/fingerprint', [FingerprintController, 'index']).as('fingerprint.index')
    router.post('/fingerprint/:id/connect', [FingerprintController, 'connect']).as('fingerprint.connect')
    router.post('/fingerprint/:id/sync-users', [FingerprintController, 'syncUsers']).as('fingerprint.sync')
    router.post('/fingerprint/:id/download-logs', [FingerprintController, 'downloadLogs']).as('fingerprint.download')
    router.post('/fingerprint/:id/start-monitoring', [FingerprintController, 'startMonitoring']).as('fingerprint.monitor')
    router.post('/fingerprint/:id/clear-logs', [FingerprintController, 'clearLogs']).as('fingerprint.clear')
    router.post('/fingerprint/enroll', [FingerprintController, 'enrollFingerprint']).as('fingerprint.enroll')
    router.get('/fingerprint/enrollment-status/:enrollmentId', [FingerprintController, 'enrollmentStatus']).as('fingerprint.enrollment.status')
    router.delete('/fingerprint/:id', [FingerprintController, 'deleteFingerprint']).as('fingerprint.delete')
}).middleware(middleware.auth())