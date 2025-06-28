import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const TeachersController = () => import('#controllers/WEB/Teachers/index')

router.group(() => {
  router.get('/teachers', [TeachersController, 'index']).as('teachers.index')
  router.get('/teachers/create', [TeachersController, 'create']).as('teachers.create')
  router.post('/teachers', [TeachersController, 'store']).as('teachers.store')
  router.get('/teachers/:id', [TeachersController, 'show']).as('teachers.show')
  router.get('/teachers/:id/edit', [TeachersController, 'edit']).as('teachers.edit')
  router.put('/teachers/:id', [TeachersController, 'update']).as('teachers.update')
  router.delete('/teachers/:id', [TeachersController, 'destroy']).as('teachers.destroy')
}).middleware(middleware.auth())