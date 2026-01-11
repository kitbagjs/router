import { Route, Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
import { checkDuplicateNames } from '@/utilities/checkDuplicateNames'
import { checkMissingContext } from '@/utilities/checkMissingContext'
import { stringHasValue } from '@/utilities/guards'
import { isNamedRoute } from './routeMatchRules'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { withParams } from './withParams'

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
  ].flat()

  const routeIdsToRoutes = new Map<string, Route>()
  const routeNamesToRoutes = new Map<string, Route>()

  function addRoute(route: Route): void {
    if (!isNamedRoute(route)) {
      return
    }

    const existingRouteByName = routeNamesToRoutes.get(route.name)

    if (existingRouteByName?.id !== route.id) {
      throw new DuplicateNamesError(route.name)
    }

    insertBaseRoute(route, base)

    routeIdsToRoutes.set(route.id, route)
    routeNamesToRoutes.set(route.name, route)
  }

  for (const route of allRoutes) {
    addRoute(route)

    for (const context of route.context) {
      if (contextIsRoute(context)) {
        addRoute(context)
      }
    }
  }

  return Array.from(routeIdsToRoutes.values())
}
