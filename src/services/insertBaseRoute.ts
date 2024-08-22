import { combinePath } from '@/services/combinePath'
import { path } from '@/services/path'
import { Routes } from '@/types'
import { isNestedArray, stringHasValue } from '@/utilities/guards'

export function insertBaseRoute(routesOrArrayOfRoutes: Routes | Routes[], base?: string): Routes {
  const routes = isNestedArray(routesOrArrayOfRoutes) ? routesOrArrayOfRoutes.flat() : routesOrArrayOfRoutes

  if (!stringHasValue(base)) {
    return routes
  }

  const basePath = path(base, {})

  return routes.map(route => ({
    ...route,
    path: combinePath(basePath, route.path),
  }))
}