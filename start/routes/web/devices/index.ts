import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const DevicesController = () => import('#controllers/WEB/Devices/index')

router.group(() => {
  router.get('/devices', [DevicesController, 'index']).as('devices.index')
  router.get('/devices/create', [DevicesController, 'create']).as('devices.create')
  router.post('/devices', [DevicesController, 'store']).as('devices.store')
  router.get('/devices/:id', [DevicesController, 'show']).as('devices.show')
  router.get('/devices/:id/edit', [DevicesController, 'edit']).as('devices.edit')
  router.put('/devices/:id', [DevicesController, 'update']).as('devices.update')
  router.delete('/devices/:id', [DevicesController, 'destroy']).as('devices.destroy')
  router.post('/devices/:id/connect', [DevicesController, 'connect']).as('devices.connect')
  router.post('/devices/:id/disconnect', [DevicesController, 'disconnect']).as('devices.disconnect')
  router.post('/devices/:id/sync-users', [DevicesController, 'syncUsers']).as('devices.syncUsers')
  router.post('/devices/:id/sync-attendance', [DevicesController, 'syncAttendance']).as('devices.syncAttendance')
  router.post('/devices/:id/clear-logs', [DevicesController, 'clearLogs']).as('devices.clearLogs')
}).middleware(middleware.auth())