import { isUrl, RoutesKey, RoutesMap, Url } from '@/types'
import { RouterRoutes } from '@/types/routerRoute'
import { RouteWithParamsArgs } from '@/types/routeWithParams'
import { assembleUrl } from '@/utilities/urlAssembly'

export type RouterResolveOptions = {
  query?: Record<string, string>,
}

type ResolveRouteWithParamsArgs<TRoutes extends RouterRoutes, TRouteKey extends string> = [...RouteWithParamsArgs<TRoutes, TRouteKey>, options?: RouterResolveOptions | undefined]

export type RouterResolve<TRoutes extends RouterRoutes> = {
  <TRouteKey extends keyof RoutesMap<TRoutes>>(...args: [source: TRouteKey, ...args: ResolveRouteWithParamsArgs<TRoutes, TRouteKey>, options?: RouterResolveOptions | undefined]): string,
  (source: Url, options?: RouterResolveOptions): string,
}

export function resolve<TRoutes extends RouterRoutes, TRouteKey extends RoutesKey<TRoutes>>(routes: TRoutes, source: TRouteKey, ...args: ResolveRouteWithParamsArgs<TRoutes, TRouteKey>): string
export function resolve(routes: RouterRoutes, source: Url, options?: RouterResolveOptions): string
// eslint-disable-next-line max-params
export function resolve(routes: RouterRoutes, source: string, paramsOrOptions?: Record<string, unknown>, maybeOptions?: RouterResolveOptions): string
// eslint-disable-next-line max-params
export function resolve(routes: RouterRoutes, source: string, paramsOrOptions?: Record<string, unknown>, maybeOptions?: RouterResolveOptions): string {
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


export function createRouterResolve<TRoutes extends RouterRoutes>(routes: TRoutes): RouterResolve<TRoutes> {
  return (source: string, ...args: any[]) => resolve(routes, source, ...args)
}