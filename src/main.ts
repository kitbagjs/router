export * from './errors'
export * from './services'
export * from './types'
export type { RouterLinkProps, ToCallback } from '@/components/routerLink'
export type { UseLink, UseLinkOptions } from './compositions/useLink'

import { routerInjectionKey } from './keys'
import { createRouterAssets } from './services/createRouterAssets'

export const {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  onAfterRouteLeave,
  onAfterRouteUpdate,
  isRoute,
  RouterView,
  RouterLink,
  useRoute,
  useRouter,
  useQueryValue,
  useLink,
} = createRouterAssets(routerInjectionKey)

export type { CreateRouteOptions } from './types/createRouteOptions'
export { createRoute } from './services/createRoute'
export { createExternalRoute } from './services/createExternalRoute'
export { createRouterAssets } from './services/createRouterAssets'

declare module 'vue' {
  export interface GlobalComponents {
    RouterView: typeof RouterView,
    RouterLink: typeof RouterLink,
  }
}
