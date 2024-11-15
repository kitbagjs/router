import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { assembleUrl } from '@/services/urlAssembly'
import { Routes } from '@/types/route'
import { RouterPushOptions } from '@/types/routerPush'
import { RoutesName } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { isUrl, Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { createUrl } from '@/services/urlCreator'
import { parseUrl } from '@/services/urlParser'
import { QueryRecord } from '@/types/query'

export type RouterResolveOptions = {
  query?: QueryRecord,
  hash?: string,
}

type RouterResolveArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>,
  TParams = RouteParamsByKey<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterResolveOptions]
  : [params: TParams, options?: RouterResolveOptions]

export type RouterResolve<
  TRoutes extends Routes
> = {
  <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterResolveArgs<TRoutes, TSource>): Url,
  (url: Url, options?: RouterResolveOptions): Url,
}

export function createRouterResolve<const TRoutes extends Routes>(routes: TRoutes): RouterResolve<TRoutes> {
  return (
    source: Url | RoutesName<TRoutes>,
    paramsOrOptions?: Record<string, unknown>,
    maybeOptions?: RouterResolveOptions,
  ): Url => {
    if (isUrl(source)) {
      const options: RouterPushOptions = paramsOrOptions ?? {}

      const { searchParams, ...parts } = parseUrl(source)
      Object.entries(options.query ?? {}).forEach(([key, value]) => {
        searchParams.append(key, value)
      })
      return createUrl({ ...parts, searchParams })
    }

    const params = paramsOrOptions ?? {}
    const options: RouterResolveOptions = maybeOptions ?? {}
    const match = routes.find((route) => route.name === source)

    if (!match) {
      throw new RouteNotFoundError(String(source))
    }

    const url = assembleUrl(match, {
      params,
      query: options.query,
      hash: options.hash,
    })

    return url
  }
}
