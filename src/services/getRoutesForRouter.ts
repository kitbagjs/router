import { Route, Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
import { insertBaseRoute } from '@/services/insertBaseRoute'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { RouteContext } from '@/types/routeContext'

/**
 * Takes in routes and plugins and returns a list of routes with the base route inserted if provided.
 * Also checks for duplicate names in the routes.
 *
 * @throws {DuplicateNamesError} If there are duplicate names in the routes.
 */
export function getRoutesForRouter(routes: Routes | Routes[], plugins: RouterPlugin[] = [], base?: string): Routes {
  const providedRoutes = routes.flat()
  const missingRoutes = providedRoutes.flatMap((route) => route.context).filter(contextIsRoute)
  const pluginRoutes = plugins.flatMap((plugin) => plugin.routes)
  const missingPluginRoutes = pluginRoutes.flatMap((route) => route.context).filter(contextIsRoute)

  return Array.from([
    ...providedRoutes,
    ...missingRoutes,
    ...pluginRoutes,
    ...missingPluginRoutes,
  ]
    .filter(isNamedRoute)
    .reduce((routesMap, route) => {
      if (!routesMap.has(route.name)) {
        routesMap.set(route.name, insertBaseRoute(route, base))

        return routesMap
      }

      const existingRoute = routesMap.get(route.name)
      if (existingRoute?.id !== route.id) {
        throw new DuplicateNamesError(route.name)
      }

      return routesMap
    }, new Map<string, Route>())
    .values(),
  )
}

function contextIsRoute(context: RouteContext): context is Route {
  return 'id' in context
}
