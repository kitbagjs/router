import { Resolved, Route, RouteMethods, Routes } from '@/types'
import { createRouteMethods, generateRouteRegexPattern, resolveRoutes, routeParamsAreValid } from '@/utilities'

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
  const resolvedWithRegex: { regexp: RegExp, route: Resolved<Route> }[] = resolved.map(route => {
    const regexp = generateRouteRegexPattern(route.path)

    return { regexp, route }
  })

  function routeMatch(path: string): Resolved<T[number]> | undefined {
    const { route } = resolvedWithRegex.find(({ regexp, route }) => regexp.test(path) && routeParamsAreValid(path, route)) ?? {}

    return route
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
    routes: createRouteMethods<T>(resolved),
    push,
    replace,
    forward,
    back,
    go,
    routeMatch,
  }

  return router
}