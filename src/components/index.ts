import NotFound from '@/components/notFound'
import RouterLink from '@/components/routerLink'
import RouterView from '@/components/routerView'

export { RouterView, RouterLink, NotFound }

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    RouterView: typeof RouterView,
    RouterLink: typeof RouterLink,
  }
}
