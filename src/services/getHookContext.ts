import { Hooks } from '@/models/hooks'
import { isHook } from '@/types/hook'
import { RouteContext } from '@/types/routeContext'

/**
 * Collects context declared by reusable hooks registered before router creation.
 */
export function getHookContext(stores: Hooks[]): RouteContext[] {
  return stores.flatMap((store) => {
    const hooks = [...store.onBeforeRouteEnter, ...store.onBeforeRouteUpdate]

    return hooks.flatMap((hook) => {
      if (!isHook(hook)) {
        return []
      }

      return [...hook.context]
    })
  })
}
