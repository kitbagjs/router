import RouterLink from '@/components/routerLink.vue'
import RouterView from '@/components/routerView.vue'

export { RouterView, RouterLink }

declare module 'vue' {
  export interface GlobalComponents {
    RouterView: typeof RouterView,
    RouterLink: typeof RouterLink,
  }
}
