import { Route } from '@/types/route'
import { getHooks } from '@/types/hooks'
import { RouteContext, hasGetContext } from '@/types/routeContext'

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
  const dependencies = route.matches.flatMap((match) => [
    ...Object.values(match.views),
    ...Object.values(match.loaders),
  ])

  return [
    ...route.context,
    ...[...hooks, ...dependencies].filter(hasGetContext).flatMap((dependency) => dependency.getContext()),
  ]
}
