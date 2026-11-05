import { createRoute } from '@kitbag/router'
import { defineAsyncComponent } from 'vue'
import { account } from './account.route'

export const preferences = createRoute({
  parent: account,
  name: 'preferences',
  path: '/preferences',
})
  .addView(defineAsyncComponent(() => import('./PreferencesPage.vue')))
