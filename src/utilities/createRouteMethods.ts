import { Resolved, Route, isPublicRoute } from '@/types'
import { assembleUrl } from '@/utilities/urlAssembly'

export function createRouteMethods(routes: Resolved<Route>[]): Record<string, unknown> {
  return routes.reduce<Record<string, unknown>>((methods, route) => {
    Object.assign(methods, assembleRouteParentContext(route))

    return methods
    // use assembleUrl(route, args) to generate string URL
  }, {})
}

export function assembleRouteParentContext(route: Resolved<Route>): Record<string, unknown> {
  return {
    [route.name]: isPublicRoute(route.matched) ? routeMethodInstance(route) : {},
  }
}

export type RouteMethodInstance = (values: Record<string, unknown[]>) => { url: string }
function routeMethodInstance(route: Resolved<Route>): RouteMethodInstance {
  return (values) => {
    const url = assembleUrl(route, values)

    return { url }
  }
}