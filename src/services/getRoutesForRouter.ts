import { Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
import { insertBaseRoute } from '@/services/insertBaseRoute'
import { checkDuplicateNames } from '@/utilities/checkDuplicateNames'
import { discoverMissingRoutes } from '@/utilities/discoverMissingRoutes'
import { isNamedRoute } from '@/utilities/isNamedRoute'

/**
 * Takes in routes and plugins and returns a list of routes with the base route inserted if provided.
 * Also checks for duplicate names in the routes.
 *
 * @throws {DuplicateNamesError} If there are duplicate names in the routes.
 */
export function getRoutesForRouter(routes: Routes | Routes[], plugins: RouterPlugin[] = [], base?: string): Routes {
  const allProvidedRoutes = [
    ...routes,
    ...plugins.map((plugin) => plugin.routes),
  ].flat().filter(isNamedRoute)

  const allRoutes = [
    ...allProvidedRoutes,
    ...discoverMissingRoutes(allProvidedRoutes),
  ]

  checkDuplicateNames(allRoutes)

  return insertBaseRoute(allRoutes, base)
}
