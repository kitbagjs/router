import { Resolved, Route, RouteMethod, RouteMethods, Routes, isRouteMethodResponse } from '@/types'
import { ExtractRoutePathParameters, RoutePaths } from '@/types/routePaths'
import { flattenParentMatches } from '@/utilities/flattenParentMatches'
import { isRecord } from '@/utilities/guards'
import { normalizeRouteParams } from '@/utilities/normalizeRouteParams'
import { RouterNavigation } from '@/utilities/routerNavigation'
import { assembleUrl } from '@/utilities/urlAssembly'

export type RouterPushOptions = {
  query?: Record<string, unknown>,
  replace?: boolean,
}

export type RouteWithParams<
  TRoutes extends Routes,
  TRoutePath extends string
> = {
  route: TRoutePath & RoutePaths<TRoutes>,
  params: ExtractRoutePathParameters<RouteMethods<TRoutes>, TRoutePath>,
}

export type RouterPush<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>, options?: RouterPushOptions) => Promise<void>

type RouterPushContext = {
  navigation: RouterNavigation,
  resolved: Resolved<Route>[],
}

export function createRouterPush<
  TRoutes extends Routes
>({ navigation, resolved }: RouterPushContext): RouterPush<TRoutes> {
  return (source, options) => {
    if (typeof source === 'string') {
      return navigation.update(source, options)
    }

    if (isRouteMethodResponse(source)) {
      return navigation.update(source.url, options)
    }

    if (isRecord(source)) {
      const match = resolved.find((resolvedRoute) => flattenParentMatches(resolvedRoute) === source.route)

      if (!match) {
        throw `No route found: "${String(source)}"`
      }

      const params = get<Record<string, unknown>>(source, 'params')
      const normalized = normalizeRouteParams(params)
      const url = assembleUrl(match, normalized)

      return navigation.update(url, options)
    }

    const exhaustive: never = source
    throw new Error(`Unhandled router push overload: ${JSON.stringify(exhaustive)}`)
  }
}

// This is a typescript hack to prevent typescript from attempting to do any type checking on a property
function get<T = unknown>(source: Record<PropertyKey, unknown>, key: string): T {
  return source[key] as T
}