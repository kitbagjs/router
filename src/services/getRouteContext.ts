import { isHook } from '@/types/hook'
import { getHooks } from '@/types/hooks'
import { Route } from '@/types/route'
import { isView } from '@/types/view'
import { isLoader } from '@/types/loader'
import { RouteContext } from '@/types/routeContext'

/**
 * Collects a route's declared context and the context of its attached dependencies.
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
  const views = route.matches.flatMap((match) => Object.values(match.views))
  const loaders = route.matches.flatMap((match) => Object.values(match.loaders))

  return [
    ...route.context,
    ...hooks.filter(isHook).flatMap((hook) => hook.getContext()),
    ...views.filter(isView).flatMap((view) => view.getContext()),
    ...loaders.filter(isLoader).flatMap((loader) => loader.getContext()),
  ]
}
