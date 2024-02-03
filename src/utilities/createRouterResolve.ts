import { Resolved, Route, RouteMethod, RouteMethodResponseImplementation, Routes, isRouteMethodResponse } from '@/types'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'
import { flattenParentMatches } from '@/utilities/flattenParentMatches'
import { isRecord } from '@/utilities/guards'
import { normalizeRouteParams } from '@/utilities/normalizeRouteParams'
import { assembleUrl } from '@/utilities/urlAssembly'

type RouterResolveContext = {
  resolved: Resolved<Route>[],
}

export type RouterResolve<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>) => string

export type RouterResolveImplementation = (source: string | RouteWithParamsImplementation | RouteMethodResponseImplementation) => string

export function createRouterResolve({ resolved }: RouterResolveContext): RouterResolveImplementation {
  return (source) => {
    if (typeof source === 'string') {
      return source
    }

    if (isRouteMethodResponse(source)) {
      return source.url
    }

    if (isRecord(source)) {
      const match = resolved.find((resolvedRoute) => flattenParentMatches(resolvedRoute) === source.route)

      if (!match) {
        throw `No route found: "${String(source)}"`
      }

      const normalized = normalizeRouteParams(source.params ?? {})
      const url = assembleUrl(match, normalized)

      return url
    }

    const exhaustive: never = source
    throw new Error(`Unhandled router push overload: ${JSON.stringify(exhaustive)}`)
  }
}