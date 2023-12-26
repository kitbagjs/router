import { Resolved, RouteMethods, Routes } from '@/types'
import { createRouteMethods, resolveRoutes, routeParamsAreValid } from '@/utilities'

export type Router<
  TRoutes extends Routes
> = {
  routes: RouteMethods<TRoutes>,
  push: (url: string) => void,
  replace: (url: string) => void,
  back: () => void,
  forward: () => void,
  go: (number: number) => void,
  routeMatch: (path: string) => Resolved<TRoutes[number]> | undefined,
}

export function createRouter<T extends Routes>(routes: T): Router<T> {
  const resolved = resolveRoutes(routes)

  function routeMatch(path: string): Resolved<T[number]> | undefined {
    return resolved.find(route => route.regex.test(path) && routeParamsAreValid(path, route))
  }

  const push: Router<T>['push'] = (_url) => {
    throw 'not implemented'
  }

  const replace: Router<T>['replace'] = (_url) => {
    throw 'not implemented'
  }

  const forward: Router<T>['forward'] = () => {
    throw 'not implemented'
  }

  const back: Router<T>['forward'] = () => {
    throw 'not implemented'
  }

  const go: Router<T>['go'] = (_number) => {
    throw 'not implemented'
  }

  const router = {
    routes: createRouteMethods(resolved),
    push,
    replace,
    forward,
    back,
    go,
    routeMatch,
  }

  return router
}