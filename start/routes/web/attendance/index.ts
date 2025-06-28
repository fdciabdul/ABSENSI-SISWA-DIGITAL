import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const AttendanceController = () => import('#controllers/WEB/Attendance/index')

router.group(() => {
  router.get('/attendance', [AttendanceController, 'index']).as('attendance.index')
  router.get('/attendance/create', [AttendanceController, 'create']).as('attendance.create')
  router.get('/attendance/bulk', [AttendanceController, 'bulkCreate']).as('attendance.bulk')
  router.post('/attendance', [AttendanceController, 'store']).as('attendance.store')
  router.post('/attendance/bulk', [AttendanceController, 'bulkStore']).as('attendance.bulkStore')
  router.get('/attendance/:id/edit', [AttendanceController, 'edit']).as('attendance.edit')
  router.put('/attendance/:id', [AttendanceController, 'update']).as('attendance.update')
  router.delete('/attendance/:id', [AttendanceController, 'destroy']).as('attendance.destroy')
}).middleware(middleware.auth())