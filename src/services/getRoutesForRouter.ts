import { Route, Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { RouteContext } from '@/types/routeContext'
import { insertBaseRoute } from './insertBaseRoute'

type RouterRoutes = {
  routes: Routes,
  getRouteByName: (name: string) => Route | undefined,
}

/**
 * Takes in routes and plugins and returns a list of routes with the base route inserted if provided.
 * Also checks for duplicate names in the routes.
 *
 * @throws {DuplicateNamesError} If there are duplicate names in the routes.
 */
export function getRoutesForRouter(routes: Routes | Routes[], plugins: RouterPlugin[] = [], base?: string): RouterRoutes {
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

    if (existingRouteByName && existingRouteByName.id === route.id) {
      return
    }

    routerRoutes.set(route.name, insertBaseRoute(route, base))

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

  return {
    routes: Array.from(routerRoutes.values()).sort(sortByDepthDescending),
    getRouteByName: (name: string) => routerRoutes.get(name),
  }
}

function contextIsRoute(context: RouteContext): context is Route {
  return 'id' in context
}

function isRoutes(routes: Routes | Route): routes is Routes {
  return Array.isArray(routes)
}

function sortByDepthDescending(aRoute: Route, bRoute: Route): number {
  return bRoute.depth - aRoute.depth
}
