import { createRoute } from '@kitbag/router'
import { defineAsyncComponent } from 'vue'
import HomePage from './pages/HomePage.vue'

export const home = createRoute({ name: 'home', path: '/' }).addView(HomePage)

export const checkout = createRoute({ name: 'checkout', path: '/checkout' })
  .addLoader(() => 'A manually registered loader still works.', { name: 'manual' })
  .addView(defineAsyncComponent(() => import('./pages/CheckoutPage.vue')))

export const profile = createRoute({ name: 'profile', path: '/profile' })
  .addView(defineAsyncComponent(() => import('./pages/ProfilePage.vue')))

export const routes = [home, checkout, profile] as const
