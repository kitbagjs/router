import { createRoute } from '@kitbag/router'
import { defineAsyncComponent } from 'vue'

export const destination = createRoute({
  name: 'pickup',
  path: '/pickup',
})
  .addView(defineAsyncComponent(() => import('./PickupPage.vue')))
