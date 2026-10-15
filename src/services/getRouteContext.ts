import { Route } from '@/types/route'
import { isLoader } from '@/types/loader'
import { RouteContext } from '@/types/routeContext'

/**
 * Collects a route's declared context and the context of its attached loaders.
 */
export function getRouteContext(route: Route): RouteContext[] {
  const loaders = route.matches.flatMap((match) => Object.values(match.loaders))

  return [
    ...route.context,
    ...loaders.filter(isLoader).flatMap((loader) => loader.getContext()),
  ]
}
