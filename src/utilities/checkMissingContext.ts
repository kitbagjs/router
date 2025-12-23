import { MissingRouteContextError } from '@/errors/missingRouteContextError'
import { Route, Routes } from '@/types/route'
import { RouteContext } from '@/types/routeContext'

export function checkMissingContext(routes: Routes): void {
  const routeIdsFromContext = routes
    .flatMap((route) => route.context)
    .filter(contextIsRoute)

  for (const route of routeIdsFromContext) {
    if (routes.every(({ id }) => route.id !== id)) {
      throw new MissingRouteContextError(route.name)
    }
  }
}

function contextIsRoute(context: RouteContext): context is Route {
  return 'id' in context
}
