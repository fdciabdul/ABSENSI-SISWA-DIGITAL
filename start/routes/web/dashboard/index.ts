
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const DashboardController = () => import('#controllers/WEB/Dashboard/index')
router.group(() => {
  router.get('/dashboard', [DashboardController, 'index']).as('dashboard')
}).use(middleware.auth())