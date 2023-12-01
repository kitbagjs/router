import { RouteFlat, RouteMethods, Routes } from '@/types'
import { flattenRoutes } from '@/utilities/flattenRoutes'

export function createRouter<T extends Routes>(routes: T): { routes: RouteMethods<T, Record<never, never>> } {
  const flattened = flattenRoutes(routes)

  function routeMatch(path: string): RouteFlat | undefined {
    return flattened.find(route => route.regex.test(path))
  }

  throw 'not implemented'
}