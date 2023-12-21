import { RouteFlat, RouteMethods, Routes } from '@/types'
import { flattenRoutes } from '@/utilities/flattenRoutes'

export type Router<T extends Routes> = {
  routes: RouteMethods<T>,
  push: (url: string) => void,
  replace: (url: string) => void,
  back: () => void,
  forward: () => void,
  go: (number: number) => void,
  routeMatch: (path: string) => RouteFlat[],
}

function createRouteMethods<T extends Routes>(_routes: T): RouteMethods<T> {
  return {} as any
}

export function createRouter<T extends Routes>(routes: T): Router<T> {
  const flattened = flattenRoutes(routes)

  function routeMatch(path: string): RouteFlat[] {
    return flattened.filter(route => route.regex.test(path))
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
    routes: createRouteMethods(routes),
    push,
    replace,
    forward,
    back,
    go,
    routeMatch,
  }

  return router
}