import { Route, Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { RouteContext } from '@/types/routeContext'
import { insertBaseRoute } from './insertBaseRoute'

/**
 * Takes in routes and plugins and returns a list of routes with the base route inserted if provided.
 * Also checks for duplicate names in the routes.
 *
 * @throws {DuplicateNamesError} If there are duplicate names in the routes.
 */
export function getRoutesForRouter(routes: Routes | Routes[], plugins: RouterPlugin[] = [], base?: string): Routes {
  // Map of route name to route
  const routerRoutes = new Map<string, Route>()

  const allRoutes = [
    ...routes,
    ...plugins.map((plugin) => plugin.routes),
  ]

  function addRoute(route: Route): void {
    if (!isNamedRoute(route)) {
      return
    }

    const existingRouteByName = routerRoutes.get(route.name)

    if (existingRouteByName && existingRouteByName.id !== route.id) {
      throw new DuplicateNamesError(route.name)
    }

    insertBaseRoute(route, base)

    routerRoutes.set(route.name, route)

    for (const context of route.context) {
      if (contextIsRoute(context)) {
        addRoute(context)
      }
    }
  }

  function addRoutes(routes: Routes): void {
    for (const route of routes) {
      addRoute(route)
    }
  }

  for (const route of allRoutes) {
    if (isRoutes(route)) {
      addRoutes(route)
      continue
    }

    addRoute(route)
  }

  return Array.from(routerRoutes.values())
}

function contextIsRoute(context: RouteContext): context is Route {
  return 'id' in context
}

function isRoutes(routes: Routes | Route): routes is Routes {
  return Array.isArray(routes)
}
