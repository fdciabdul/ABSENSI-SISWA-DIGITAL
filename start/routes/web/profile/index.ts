import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ProfileController = () => import('#controllers/WEB/Profile/index')
const SettingsController = () => import('#controllers/WEB/Settings/index')

router.group(() => {
  router.get('/profile', [ProfileController, 'index']).as('profile.index')
  router.put('/profile', [ProfileController, 'update']).as('profile.update')
  router.put('/profile/password', [ProfileController, 'changePassword']).as('profile.password')
  router.post('/profile/avatar', [ProfileController, 'uploadAvatar']).as('profile.avatar')
}).middleware(middleware.auth())

router.group(() => {
  router.get('/settings', [SettingsController, 'index']).as('settings.index')
  router.put('/settings', [SettingsController, 'update']).as('settings.update')
  router.get('/settings/export', [SettingsController, 'exportData']).as('settings.export')
  router.delete('/settings/account', [SettingsController, 'deleteAccount']).as('settings.delete')
}).middleware(middleware.auth())