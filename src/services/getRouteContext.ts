import { Route } from '@/types/route'
import { isView } from '@/types/view'
import { isLoader } from '@/types/loader'
import { RouteContext } from '@/types/routeContext'

/**
 * Collects a route's declared context and the context of its attached views and loaders.
 */
export function getRouteContext(route: Route): RouteContext[] {
  const views = route.matches.flatMap((match) => Object.values(match.views))
  const loaders = route.matches.flatMap((match) => Object.values(match.loaders))

  return [
    ...route.context,
    ...views.filter(isView).flatMap((view) => view.context),
    ...loaders.filter(isLoader).flatMap((loader) => loader.context),
  ]
}
