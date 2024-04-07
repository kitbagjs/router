import { RouterRoute, Routes } from '@/types'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'
import { isRecord } from '@/utilities/guards'
import { assembleUrl } from '@/utilities/urlAssembly'

export type RouterResolveOptions = {
  query?: Record<string, string>,
}

export type RouterResolve<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath>, options?: RouterResolveOptions) => string

export type RouterResolveImplementation = (source: string | RouteWithParamsImplementation, options?: RouterResolveOptions) => string

export function createRouterResolve(routes: Readonly<RouterRoute[]>): RouterResolveImplementation {
  return (source, options) => {
    if (typeof source === 'string') {
      return source
    }

    if (isRecord(source)) {
      const match = routes.find((route) => route.name === source.route)

      if (!match) {
        throw `No route found: "${String(source)}"`
      }

      const url = assembleUrl(match, {
        params: source.params ?? {},
        query: options?.query,
      })

      return url
    }

    const exhaustive: never = source
    throw new Error(`Unhandled router push overload: ${JSON.stringify(exhaustive)}`)
  }
}