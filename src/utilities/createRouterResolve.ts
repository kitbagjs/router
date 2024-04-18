import { RouterRoutes } from '@/types/routerRoute'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByName } from '@/types/routeWithParams'
import { isUrl, Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { assembleUrl } from '@/utilities/urlAssembly'

export type RouterResolveOptions = {
  query?: Record<string, string>,
}

type RouterResolveArgs<
  TRoutes extends RouterRoutes,
  TSource extends string & keyof RoutesKey<TRoutes>,
  TParams = RouteParamsByName<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterResolveOptions]
  : [params: TParams, options?: RouterResolveOptions]

export type RouterResolve<
  TRoutes extends RouterRoutes
> = {
  <TSource extends RoutesKey<TRoutes>>(source: TSource, ...args: RouterResolveArgs<TRoutes, TSource>): string,
  (source: Url, options?: RouterResolveOptions): string,
}

export function createRouterResolve<const TRoutes extends RouterRoutes>(routes: TRoutes): RouterResolve<TRoutes> {

  return <TRoutes extends RouterRoutes, TSource extends Url | RoutesKey<TRoutes>>(
    source: TSource,
    paramsOrOptions?: Record<string, unknown>,
    maybeOptions?: RouterResolveOptions,
  ): string => {
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

}