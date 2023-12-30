import { Resolved, Route, RouteMethodResponse, isPublicRoute } from '@/types'
import { assembleUrl } from '@/utilities/urlAssembly'

type NonCallableNode = Record<string, any>
type CallableNode = NonCallableNode & {
  (values: Record<string, unknown[]>): RouteMethodResponse,
}
type Node = CallableNode | NonCallableNode

export function createRouteMethods(routes: Resolved<Route>[]): Record<string, Node> {
  const methods: Record<string, any> = {}

  routes.forEach(route => {
    traverseParents(route, methods)
  })

  return methods
}

function traverseParents(route: Resolved<Route>, currentLevel: Record<string, any>): Record<string, any> {
  route.matches.forEach(match => {
    if (!match.name) {
      return
    }

    if (match === route.matched) {
      const routeNode = createNodeForRoute(route)

      Object.assign(routeNode, currentLevel[route.name])

      currentLevel[route.name] = routeNode

      return currentLevel
    }

    if (!currentLevel[match.name]) {
      currentLevel[match.name] = {}
    }

    currentLevel = currentLevel[match.name]
  })

  return currentLevel
}

function createNodeForRoute(route: Resolved<Route>): Node {
  if (isPublicRoute(route.matched)) {
    return createCallableNode(route)
  }

  return {}
}

function createCallableNode(route: Resolved<Route>): CallableNode {
  const node: CallableNode = (values) => {
    const url = assembleUrl(route, values)
    const { then } = new Promise<{ url: string }>(resolve => resolve({ url }))

    return {
      url,
      then,
    }
  }

  return node
}