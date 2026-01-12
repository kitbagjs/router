import { Route, Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
import { stringHasValue } from '@/utilities/guards'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { withParams } from './withParams'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { RouteContext } from '@/types/routeContext'

export function insertBaseRoute(route: Route, base?: string): Route {
  if (!stringHasValue(base)) {
    return route
  }
  return {
    ...route,
    path: withParams(`${base}${route.path.value}`, route.path.params),
  }
}

/**
 * Takes in routes and plugins and returns a list of routes with the base route inserted if provided.
 * Also checks for duplicate names in the routes.
 *
 * @throws {DuplicateNamesError} If there are duplicate names in the routes.
 */
export function getRoutesForRouter(routes: Routes | Routes[], plugins: RouterPlugin[] = [], base?: string): Routes {
  const allRoutes = [
    ...routes,
    ...plugins.map((plugin) => plugin.routes),
  ]

  const routeIdsToRoutes = new Map<string, Route>()
  const routeNamesToRoutes = new Map<string, Route>()

  function addRoute(route: Route): void {
    if (!isNamedRoute(route)) {
      return
    }

    const existingRouteByName = routeNamesToRoutes.get(route.name)

    if (existingRouteByName && existingRouteByName.id !== route.id) {
      throw new DuplicateNamesError(route.name)
    }

    insertBaseRoute(route, base)

    routeIdsToRoutes.set(route.id, route)
    routeNamesToRoutes.set(route.name, route)

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

  return Array.from(routeIdsToRoutes.values())
}

function contextIsRoute(context: RouteContext): context is Route {
  return 'id' in context
}

function isRoutes(routes: Routes | Route): routes is Routes {
  return Array.isArray(routes)
}
