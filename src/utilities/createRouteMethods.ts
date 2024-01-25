import { Resolved, Route, RouteMethods, RouterPush, Routes, isPublicRoute } from '@/types'
import { RouteMethod, RouteMethodPush, RouteMethodReplace } from '@/types/routeMethod'
import { asArray } from '@/utilities/array'
import { assembleUrl } from '@/utilities/urlAssembly'

type RouteMethodsContext = {
  resolved: Resolved<Route>[],
  push: RouterPush,
}

export function createRouteMethods<T extends Routes>({ resolved, push }: RouteMethodsContext): RouteMethods<T> {
  const methods = resolved.reduce<Record<string, any>>((methods, route) => {
    let level = methods

    route.matches.forEach(match => {
      if (!match.name) {
        return
      }

      const isLeaf = match === route.matched

      if (isLeaf && isPublicRoute(route.matched)) {
        const method = createRouteMethod({ route, push })

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

type CreateRouteMethodArgs = {
  route: Resolved<Route>,
  push: RouterPush,
}

function createRouteMethod({ route, push: routerPush }: CreateRouteMethodArgs): RouteMethod {
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

function normalizeRouteParams(params: Record<string, unknown>): Record<string, unknown[]> {
  const normalizedParams: Record<string, unknown[]> = {}

  for (const key of Object.keys(params)) {
    const value = params[key]

    normalizedParams[key] = asArray(value)
  }

  return normalizedParams
}