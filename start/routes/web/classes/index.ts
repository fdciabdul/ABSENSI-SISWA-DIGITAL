const ClassesController = () => import('#controllers/WEB/Classes/index')
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
router.group(() => {
  router.get('/classes', [ClassesController, 'index']).as('classes.index')
  router.get('/classes/create', [ClassesController, 'create']).as('classes.create')
  router.post('/classes', [ClassesController, 'store']).as('classes.store')
  router.get('/classes/:id', [ClassesController, 'show']).as('classes.show')
  router.get('/classes/:id/edit', [ClassesController, 'edit']).as('classes.edit')
  router.put('/classes/:id', [ClassesController, 'update']).as('classes.update')
  router.delete('/classes/:id', [ClassesController, 'destroy']).as('classes.destroy')
}).middleware(middleware.auth())
