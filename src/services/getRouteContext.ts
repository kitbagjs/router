import { Route } from '@/types/route'
import { RouteContext } from '@/types/routeContext'

/**
 * Collects a route's declared context.
 */
export function getRouteContext(route: Route): RouteContext[] {
  return [...route.context]
}
