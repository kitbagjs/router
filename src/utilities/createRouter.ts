import { RouteFlat, RouteMethods, Routes } from '@/types'
import { flattenRoutes } from '@/utilities/flattenRoutes'

export type Router<T extends Routes> = {
  // routes: RouteMethods<T, Record<never, never>>,
  routeMatch: (path: string) => RouteFlat[],
}

export function createRouter<T extends Routes>(routes: T): Router<T> {
  const flattened = flattenRoutes(routes)

  function routeMatch(path: string): RouteFlat[] {
    return flattened.filter(route => route.regex.test(path))
  }

  return {
    // routes: {} as RouteMethods<T, Record<never, never>>,
    routeMatch,
  }
}