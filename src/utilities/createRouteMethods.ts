import { Resolved, Route, isPublicRoute } from '@/types'
import { assembleUrl } from '@/utilities/urlAssembly'

export function createRouteMethods(routes: Resolved<Route>[]): Record<string, any> {
  return routes.reduce<Record<string, any>>((methods, route) => {
    const thing = assembleRouteParentContext(route, [...route.parentNames])

    console.log(JSON.stringify(thing))

    return methods
  }, {})
}

export function assembleRouteParentContext(route: Resolved<Route>, parentNames: string[]): Record<string, any> {
  const nextLevel = parentNames.shift()

  if (!nextLevel) {
    return isPublicRoute(route.matched) ? routeMethodInstance(route) : {}
  }

  return {
    [nextLevel]: assembleRouteParentContext(route, parentNames),
  }
}

export type RouteMethodInstance = (values: Record<string, unknown[]>) => { url: string }
function routeMethodInstance(route: Resolved<Route>): RouteMethodInstance {
  return (values) => {
    const url = assembleUrl(route, values)

    return { url }
  }
}