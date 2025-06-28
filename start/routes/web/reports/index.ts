import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const ReportsController = () => import('#controllers/WEB/Reports/index')

router.group(() => {
  router.get('/reports', [ReportsController, 'index']).as('reports.index')
  router.get('/reports/attendance', [ReportsController, 'attendance']).as('reports.attendance')
  router.get('/reports/students', [ReportsController, 'students']).as('reports.students')
  router.get('/reports/classes', [ReportsController, 'classes']).as('reports.classes')
  router.get('/reports/devices', [ReportsController, 'devices']).as('reports.devices')
  router.post('/reports/export/attendance', [ReportsController, 'exportAttendance']).as('reports.export.attendance')
  router.post('/reports/export/students', [ReportsController, 'exportStudents']).as('reports.export.students')
  router.post('/reports/export/classes', [ReportsController, 'exportClasses']).as('reports.export.classes')
  router.get('/reports/api/attendance-chart', [ReportsController, 'attendanceChartData']).as('reports.api.attendance-chart')
  router.get('/reports/api/class-performance', [ReportsController, 'classPerformanceData']).as('reports.api.class-performance')
  router.get('/reports/api/monthly-trends', [ReportsController, 'monthlyTrendsData']).as('reports.api.monthly-trends')
}).middleware(middleware.auth())