import { RouterRoute, RouteMiddleware, isNamedRoute } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { asArray } from '@/utilities/array'
import { RouteHookLifeCycle, RouteHookType } from '@/utilities/createRouterHooks'

export function getRoutePath(route: RouterRoute): string {
  return route.matches
    .filter(route => isNamedRoute(route))
    .map(route => route.name)
    .join('.')
}

function getRouterHookTypes(type: RouteHookType): RouteHookLifeCycle[] {
  if (type === 'before') {
    return ['onBeforeRouteEnter', 'onBeforeRouteUpdate', 'onBeforeRouteLeave']
  }

  throw 'not implemented'
}

// todo: need the concept of a hook condition here as well
export function getRouteHooks(route: ResolvedRoute | null, type: RouteHookType): RouteMiddleware[] {
  if (!route) {
    return []
  }

  const types = getRouterHookTypes(type)

  return route.matches.flatMap(route => types.flatMap(type => {
    const hooks = route[type]

    if (!hooks) {
      return []
    }

    return asArray(hooks)
  }))
}