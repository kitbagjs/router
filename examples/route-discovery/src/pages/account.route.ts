import { createRoute } from '@kitbag/router'
import { defineAsyncComponent } from 'vue'

export const account = createRoute({
  name: 'account',
  path: '/account',
})
  .addView(defineAsyncComponent(() => import('./AccountLayout.vue')))
