import { Resolved, Route, isNamedRoute, isParentRoute, isPublicRoute } from '@/types'
import { assembleUrl } from '@/utilities/urlAssembly'

export function createRouteMethods(routes: Resolved<Route>[]): Record<string, unknown> {
  return routes.reduce<Record<string, unknown>>((methods, route) => {
    if (isNamedRoute(route.matched)) {
      methods[route.name] = {}

      if (isPublicRoute(route.matched)) {
        methods[route.name] = routeMethodInstance(route)
      }
    }

    if (isParentRoute(route.matched)) {
      Object.assign(methods, createRouteMethods(route.children))
    }

    return methods
    // use assembleUrl(route, args) to generate string URL
  }, {})
}

export type RouteMethodInstance = (values: Record<string, unknown[]>) => { url: string }
function routeMethodInstance(route: Resolved<Route>): RouteMethodInstance {
  return (values) => {
    const url = assembleUrl(route, values)

    return { url }
  }
}