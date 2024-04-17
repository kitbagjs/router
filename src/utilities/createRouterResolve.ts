import { RouterRoutes } from '@/types/routerRoute'
import { RoutesKey } from '@/types/routesMap'
import { RouteKeysThatHaveOptionalParams, RouteKeysThatHaveRequireParams, RouteParamsByName } from '@/types/routeWithParams'
import { isUrl, Url } from '@/types/url'
import { assembleUrl } from '@/utilities/urlAssembly'

export type RouterResolveOptions = {
  query?: Record<string, string>,
}

export type RouterResolve<
  TRoutes extends RouterRoutes
> = {
  <TSource extends RouteKeysThatHaveOptionalParams<TRoutes>>(source: TSource, params?: RouteParamsByName<TRoutes, TSource>, options?: RouterResolveOptions): string,
  <TSource extends RouteKeysThatHaveRequireParams<TRoutes>>(source: TSource, params: RouteParamsByName<TRoutes, TSource>, options?: RouterResolveOptions): string,
  (source: Url, options?: RouterResolveOptions): string,
}

export function createRouterResolve<const TRoutes extends RouterRoutes>(routes: TRoutes): RouterResolve<TRoutes> {
  function resolve<TSource extends RouteKeysThatHaveRequireParams<TRoutes>>(
    source: TSource,
    params: RouteParamsByName<TRoutes, TSource>,
    options?: RouterResolveOptions
  ): string
  function resolve<TSource extends RouteKeysThatHaveOptionalParams<TRoutes>>(
    source: TSource,
    params?: RouteParamsByName<TRoutes, TSource>,
    options?: RouterResolveOptions
  ): string
  function resolve(
    source: Url,
    options?: RouterResolveOptions
  ): string
  function resolve<TRoutes extends RouterRoutes, TSource extends Url | RoutesKey<TRoutes>>(
    source: TSource,
    paramsOrOptions?: Record<string, unknown>,
    maybeOptions?: RouterResolveOptions,
  ): string {
    if (isUrl(source)) {
      return source
    }

    const params = paramsOrOptions ?? {}
    const options: RouterResolveOptions = maybeOptions ?? {}
    const match = routes.find((route) => route.name === source)

    if (!match) {
      throw `Route not found: "${String(source)}"`
    }

    if (match.matched.disabled) {
      throw `Route disabled: "${String(source)}"`
    }

    const url = assembleUrl(match, {
      params,
      query: options.query,
    })

    return url
  }

  return resolve
}