import { routerInjectionKey } from './useRouter'
import { createComponentHooks } from '@/services/createComponentHooks'

export const {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  onAfterRouteLeave,
  onAfterRouteUpdate,
} = createComponentHooks(routerInjectionKey)
