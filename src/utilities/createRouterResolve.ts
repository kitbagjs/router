import { RouteMethod, RouteMethodResponseImplementation, RouterRoute, Routes, isRouteMethodResponse } from '@/types'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'
import { isRecord } from '@/utilities/guards'
import { normalizeRouteParams } from '@/utilities/normalizeRouteParams'
import { getRoutePath } from '@/utilities/routes'
import { assembleUrl } from '@/utilities/urlAssembly'

export type RouterResolveOptions = {
  query?: Record<string, string>,
}

export type RouterResolve<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>, options?: RouterResolveOptions) => string

export type RouterResolveImplementation = (source: string | RouteWithParamsImplementation | RouteMethodResponseImplementation, options?: RouterResolveOptions) => string

export function createRouterResolve(routes: RouterRoute[]): RouterResolveImplementation {
  return (source, options) => {
    if (typeof source === 'string') {
      return source
    }

    if (isRouteMethodResponse(source)) {
      return source.url
    }

    if (isRecord(source)) {
      const match = routes.find((route) => getRoutePath(route) === source.route)

      if (!match) {
        throw `No route found: "${String(source)}"`
      }

      const normalized = normalizeRouteParams(source.params ?? {})
      const url = assembleUrl(match, {
        params: normalized,
        query: options?.query,
      })

      return url
    }

    const exhaustive: never = source
    throw new Error(`Unhandled router push overload: ${JSON.stringify(exhaustive)}`)
  }
}