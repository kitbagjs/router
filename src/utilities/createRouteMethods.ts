import { Resolved, Route, RouteMethodRoute, isPublicRoute } from '@/types'
import { assembleUrl } from '@/utilities/urlAssembly'

type NonCallableNode = Record<string, any>
type CallableNode = NonCallableNode & {
  (values: Record<string, unknown[]>): RouteMethodRoute,
}
type Node = CallableNode | NonCallableNode

export function createRouteMethods(routes: Resolved<Route>[]): Record<string, Node> {
  const methods: Record<string, any> = {}

  routes.forEach(route => {
    const currentLevel = traverseParents(route, methods)
    const routeNode = createNodeForRoute(route)

    Object.assign(routeNode, currentLevel[route.name])

    currentLevel[route.name] = routeNode
  })

  return methods
}

function traverseParents(route: Resolved<Route>, currentLevel: Record<string, any>): Record<string, any> {
  route.parentNames.forEach(parentName => {
    if (!currentLevel[parentName]) {
      currentLevel[parentName] = {}
    }

    currentLevel = currentLevel[parentName]
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
    return {
      push: () => null,
      replace: () => null,
      url: assembleUrl(route, values),
    }
  }

  return node
}