import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const StudentHistoryController = () =>  import('#controllers/WEB/History/index')

router.group(() => {
    // All history (combined view)
    router.get('/students/:id/all-history', [StudentHistoryController, 'allHistory']).as('students.allHistory')
    
    // Attendance history
    router.get('/students/:id/attendance-history', [StudentHistoryController, 'attendance']).as('students.attendanceHistory')
    
    // Fingerprint history  
    router.get('/students/:id/fingerprint-history', [StudentHistoryController, 'fingerprint']).as('students.fingerprintHistory')
    
    // Face recognition history
    router.get('/students/:id/face-history', [StudentHistoryController, 'faceRecognition']).as('students.faceHistory')
    
    // Export data
    router.get('/students/:id/export', [StudentHistoryController, 'export']).as('students.export')
    
}).middleware(middleware.auth())