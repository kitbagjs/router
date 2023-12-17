import { RouteFlat, RouteMethods, Routes } from '@/types'
import { flattenRoutes, routeParamsAreValid } from '@/utilities'

export type Router<T extends Routes> = {
  routes: RouteMethods<T, Record<never, never>>,
  routeMatch: (path: string) => RouteFlat | undefined,
}

export function createRouter<T extends Routes>(routes: T): Router<T> {
  const flattened = flattenRoutes(routes)

  function routeMatch(path: string): RouteFlat | undefined {
    return flattened.find(route => route.regex.test(path) && routeParamsAreValid(path, route))
  }

  return {
    routeMatch,
  } as Router<T>
}