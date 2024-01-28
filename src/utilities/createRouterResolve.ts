import { Resolved, Route, RouteMethod, isRouteMethodResponse } from '@/types'
import { flattenParentMatches } from '@/utilities/flattenParentMatches'
import { isRecord } from '@/utilities/guards'
import { normalizeRouteParams } from '@/utilities/normalizeRouteParams'
import { assembleUrl } from '@/utilities/urlAssembly'

type RouterResolveContext = {
  resolved: Resolved<Route>[],
}

export type RouterResolve = (source: string | ReturnType<RouteMethod> | { route: string, params?: Record<string, unknown> }) => string

export function createRouterResolve({ resolved }: RouterResolveContext): RouterResolve {
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