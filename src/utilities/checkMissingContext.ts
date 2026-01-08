import { createDiscoveredRoute, ProtectedRoute } from '@/services/createDiscoveredRoute'
import { Route, Routes } from '@/types/route'
import { RouteContext } from '@/types/routeContext'

export function checkMissingContext(routes: Routes): ProtectedRoute[] {
  const routeIds = new Set(routes.map((route) => route.id))
  const missingRoutes = routes
    .flatMap((route) => route.context)
    .filter(contextIsRoute)
    .filter((route) => !routeIds.has(route.id))

  return missingRoutes.reduce<ProtectedRoute[]>((unique, route) => {
    if (unique.every(({ id }) => id !== route.id)) {
      unique.push(createDiscoveredRoute(route))
    }

    return unique
  }, [])
}

function contextIsRoute(context: RouteContext): context is Route {
  return 'id' in context
}
