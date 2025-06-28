import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const StudentsController = () => import('#controllers/WEB/Students/index')

router.group(() => {
      router.post('/students/import', [StudentsController, 'import']).as('students.import')
  router.get('/students/template', [StudentsController, 'downloadTemplate']).as('students.template')
  router.get('/students', [StudentsController, 'index']).as('students.index')
  router.get('/students/create', [StudentsController, 'create']).as('students.create')
  router.post('/students', [StudentsController, 'store']).as('students.store')
  router.get('/students/:id', [StudentsController, 'show']).as('students.show')
  router.get('/students/:id/edit', [StudentsController, 'edit']).as('students.edit')
  router.put('/students/:id', [StudentsController, 'update']).as('students.update')
  router.delete('/students/:id', [StudentsController, 'destroy']).as('students.destroy')
  router.get('/api/students', [StudentsController, 'apiIndex']).as('students.api')

}).middleware(middleware.auth())