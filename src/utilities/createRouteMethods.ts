import { Resolved, Route, RouteMethod, RouteMethods, Routes, isPublicRoute } from '@/types'
import { assembleUrl } from '@/utilities/urlAssembly'

type Node = RouteMethod | { [key: string]: Node } | RouteMethod & { [key: string]: Node }

export function createRouteMethods<T extends Routes>(routes: Resolved<Route>[]): RouteMethods<T> {
  const methods: Record<string, Node | undefined> = {}

  routes.forEach(route => {
    createRouteMethod(route, methods)
  })

  return methods as unknown as RouteMethods<T>
}

function createRouteMethod(route: Resolved<Route>, methods: Record<string, Node | undefined>): void {
  let currentLevel = methods

  route.matches.forEach(match => {
    if (!match.name) {
      return
    }

    if (match === route.matched) {
      const routeNode = createNodeForRoute(route)

      Object.assign(routeNode, currentLevel[route.name])

      currentLevel[route.name] = routeNode

      return
    }

    if (!currentLevel[match.name]) {
      currentLevel[match.name] = {}
    }

    currentLevel = currentLevel[match.name]
  })
}

function createNodeForRoute(route: Resolved<Route>): Node {
  if (isPublicRoute(route.matched)) {
    return createCallableNode(route)
  }

  return {}
}

function createCallableNode(route: Resolved<Route>): RouteMethod {
  const node: RouteMethod = (values) => {
    const url = assembleUrl(route, values)
    const { then } = new Promise<{ url: string }>(resolve => resolve({ url }))

    return {
      url,
      then,
    }
  }

  return node
}