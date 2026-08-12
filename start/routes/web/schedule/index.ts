import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const SchedulesController = () => import('#controllers/WEB/Schedules/index')

router.group(() => {
  router.get('/schedules', [SchedulesController, 'index']).as('schedules.index')
  router.get('/schedules/create', [SchedulesController, 'create']).as('schedules.create')
  router.post('/schedules', [SchedulesController, 'store']).as('schedules.store').middleware(middleware.role(['admin']))
  router.get('/schedules/:id', [SchedulesController, 'show']).as('schedules.show')
  router.get('/schedules/:id/edit', [SchedulesController, 'edit']).as('schedules.edit')
  router.put('/schedules/:id', [SchedulesController, 'update']).as('schedules.update').middleware(middleware.role(['admin']))
  router.delete('/schedules/:id', [SchedulesController, 'destroy']).as('schedules.destroy').middleware(middleware.role(['admin']))
}).middleware(middleware.auth())