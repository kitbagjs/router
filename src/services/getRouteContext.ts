import { isHook } from '@/types/hook'
import { getHooks } from '@/types/hooks'
import { Route } from '@/types/route'
import { RouteContext } from '@/types/routeContext'

/**
 * Collects a route's context, including loaders and views merged during attachment, and its hooks' context.
 */
export function getRouteContext(route: Route): RouteContext[] {
  const hooks = getHooks(route).flatMap((store) => [
    ...store.onBeforeRouteEnter,
    ...store.onBeforeRouteUpdate,
    ...store.onBeforeRouteLeave,
    ...store.onAfterRouteEnter,
    ...store.onAfterRouteUpdate,
    ...store.onAfterRouteLeave,
  ])

  return [
    ...route.context,
    ...hooks.filter(isHook).flatMap((hook) => hook.context),
  ]
}
