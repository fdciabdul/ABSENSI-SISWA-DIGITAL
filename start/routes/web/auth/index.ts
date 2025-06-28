const AuthWebController = () => import('#controllers/WEB/Auth/index')

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  return response.redirect().toRoute('auth.login')
})

router.group(() => {
  router.get('/login', [AuthWebController, 'showLogin']).as('auth.login')
  router.post('/login', [AuthWebController, 'login']).as('auth.login.post')
  router.post('/logout', [AuthWebController, 'logout']).as('auth.logout')
  router.get('/logout', [AuthWebController, 'logout']).as('auth.logout.get')
})

