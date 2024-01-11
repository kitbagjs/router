import { Resolved, Route, RouteMethods, Routes, isPublicRoute } from '@/types'
import { RouteMethod } from '@/types/routeMethod'
import { assembleUrl } from '@/utilities/urlAssembly'

export function createRouteMethods<T extends Routes>(routes: Resolved<Route>[]): RouteMethods<T> {
  const methods = routes.reduce<Record<string, any>>((methods, route) => {
    let level = methods

    route.matches.forEach(match => {
      if (!match.name) {
        return
      }

      const isLeaf = match === route.matched

      if (isLeaf && isPublicRoute(route.matched)) {
        level[route.name] = Object.assign(createCallableNode(route), level[route.name])
        return
      }

      if (isLeaf) {
        return
      }

      level = level[match.name] ??= {}
    })

    return methods
  }, {})

  return methods as any
}

function createCallableNode(route: Resolved<Route>): RouteMethod {
  const node: RouteMethod = (values) => {
    const url = assembleUrl(route, values)

    return {
      url,
    }
  }

  return node
}