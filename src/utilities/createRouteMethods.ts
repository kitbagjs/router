import { Resolved, Route, RouteMethods, Routes, isPublicRoute } from '@/types'
import { RouteMethod, RouteMethodPush, RouteMethodReplace } from '@/types/routeMethod'
import { RouterPush } from '@/utilities/createRouterPush'
import { normalizeRouteParams } from '@/utilities/normalizeRouteParams'
import { assembleUrl } from '@/utilities/urlAssembly'

type RouteMethodsContext<T extends Routes> = {
  resolved: Resolved<Route>[],
  push: RouterPush<T>,
}

export function createRouteMethods<T extends Routes>({ resolved, push }: RouteMethodsContext<T>): RouteMethods<T> {
  const methods = resolved.reduce<Record<string, any>>((methods, route) => {
    let level = methods

    route.matches.forEach(match => {
      if (!match.name) {
        return
      }

      const isLeaf = match === route.matched

      if (isLeaf && isPublicRoute(route.matched)) {
        const method = createRouteMethod<T>({ route, push })

        level[route.name] = Object.assign(method, level[route.name])
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

type CreateRouteMethodArgs<T extends Routes> = {
  route: Resolved<Route>,
  push: RouterPush<T>,
}

function createRouteMethod<T extends Routes>({ route, push: routerPush }: CreateRouteMethodArgs<T>): RouteMethod {
  const node: RouteMethod = (params = {}) => {
    const normalizedParams = normalizeRouteParams(params)
    const url = assembleUrl(route, normalizedParams)

    const push: RouteMethodPush = ({ params, ...options } = {}) => {
      if (params) {
        const normalizedParamOverrides = normalizeRouteParams(params)

        const url = assembleUrl(route, {
          ...normalizeRouteParams,
          ...normalizedParamOverrides,
        })

        return routerPush(url, options)
      }

      return routerPush(url, options)
    }

    const replace: RouteMethodReplace = (options) => {
      return routerPush(url, {
        ...options,
        replace: true,
      })
    }

    return {
      url,
      push,
      replace,
    }
  }

  return node
}