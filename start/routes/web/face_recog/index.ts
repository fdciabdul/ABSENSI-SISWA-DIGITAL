import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const FaceRecognitionController = () => import('#controllers/WEB/FaceRecognition/index')

// Web Routes (require authentication)
router.group(() => {
  router.get('/face-recognition', [FaceRecognitionController, 'index']).as('face-recognition.index')
  router.get('/face-recognition/register', [FaceRecognitionController, 'register']).as('face-recognition.register')
  router.post('/face-recognition/register', [FaceRecognitionController, 'storeRegistration']).as('face-recognition.store')
  router.delete('/face-recognition/:id', [FaceRecognitionController, 'deleteFaceData']).as('face-recognition.delete')
}).middleware(middleware.auth())

// API Routes (no authentication needed for Python app)
router.group(() => {
  router.get('/face-recognition/data', [FaceRecognitionController, 'getFaceData']).as('face-recognition.data')
  router.post('/face-recognition/attendance', [FaceRecognitionController, 'recordAttendance']).as('face-recognition.attendance')
  router.get('face/students', [FaceRecognitionController, 'getStudents']).as('students.face.api')
  router.post('face-recognition/register', [FaceRecognitionController, 'storeRegistrationAPI'])
}).prefix('/api')