export * from './components'
export * from './compositions'
export * from './errors'
export * from './services'
export * from './types'

// todo: eventually, this key should be defined here
import { routerInjectionKey } from './compositions/useRouter'
import { createComponentHooks } from '@/services/createComponentHooks'

export const {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  onAfterRouteLeave,
  onAfterRouteUpdate,
} = createComponentHooks(routerInjectionKey)

export type { CreateRouteOptions } from './types/createRouteOptions'
export { isRoute } from './guards/routes'
export { createRoute } from './services/createRoute'
export { createExternalRoute } from './services/createExternalRoute'
