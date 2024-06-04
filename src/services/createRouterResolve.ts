import { RouteDisabledError } from '@/errors/routeDisabledError'
import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { assembleUrl } from '@/services/urlAssembly'
import { withQuery } from '@/services/withQuery'
import { Routes } from '@/types/route'
import { RouterPushOptions } from '@/types/routerPush'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { isUrl, Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouterResolveOptions = {
  query?: Record<string, string>,
}

type RouterResolveArgs<
  TRoutes extends Routes,
  TSource extends RoutesKey<TRoutes>,
  TParams = RouteParamsByKey<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterResolveOptions]
  : [params: TParams, options?: RouterResolveOptions]

export type RouterResolve<
  TRoutes extends Routes
> = {
  <TSource extends RoutesKey<TRoutes>>(source: TSource, ...args: RouterResolveArgs<TRoutes, TSource>): string,
  (source: Url, options?: RouterResolveOptions): string,
}

export function createRouterResolve<const TRoutes extends Routes>(routes: TRoutes): RouterResolve<TRoutes> {

  return <TRoutes extends Routes, TSource extends Url | RoutesKey<TRoutes>>(
    source: TSource,
    paramsOrOptions?: Record<string, unknown>,
    maybeOptions?: RouterResolveOptions,
  ): string => {
    if (isUrl(source)) {
      const options: RouterPushOptions = paramsOrOptions ?? {}

      return withQuery(source, options.query)
    }

    const params = paramsOrOptions ?? {}
    const options: RouterResolveOptions = maybeOptions ?? {}
    const match = routes.find((route) => route.key === source)

    if (!match) {
      throw new RouteNotFoundError(String(source))
    }

    if (match.matched.disabled) {
      throw new RouteDisabledError(String(source))
    }

    const url = assembleUrl(match, {
      params,
      query: options.query,
    })

    return url
  }

}