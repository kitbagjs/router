import { createRoute } from '@kitbag/router'
import { defineAsyncComponent } from 'vue'

export const destination = createRoute({
  name: 'shipping',
  path: '/shipping',
})
  .addView(defineAsyncComponent(() => import('./ShippingPage.vue')))

export const billing = createRoute({
  name: 'billing',
  path: '/billing',
})
  .addView(defineAsyncComponent(() => import('./BillingPage.vue')))
