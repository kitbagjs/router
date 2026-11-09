import { createRoute } from '@kitbag/router'
import { defineAsyncComponent } from 'vue'
import { countries } from '../loaders/countries'

export const checkout = createRoute({
  name: 'checkout',
  path: '/checkout',
})
  .addView(defineAsyncComponent(() => import('./CheckoutPage.vue')))

export const profile = createRoute({
  name: 'profile',
  path: '/profile',
})
  .addLoader(countries, { name: 'locations' })
  .addView(defineAsyncComponent(() => import('./ProfilePage.vue')))

export const fallback = createRoute({
  name: 'fallback',
  path: '/fallback',
})
  .addView(defineAsyncComponent(() => import('./FallbackPage.vue')))
