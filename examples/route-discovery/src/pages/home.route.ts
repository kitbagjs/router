import { createRoute } from '@kitbag/router'
import { defineAsyncComponent } from 'vue'

export const home = createRoute({
  name: 'home',
  path: '/',
})
  .addView(defineAsyncComponent(() => import('./HomePage.vue')))
