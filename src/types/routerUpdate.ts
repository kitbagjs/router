import { Param } from '@/types/params'
import { ResolvedRoute } from '@/types/resolved'
import { ExtractRouteParamTypes, Route } from '@/types/route'

export type RouteUpdateOptions = {
  query?: Record<string, string>,
  replace?: boolean,
}

export type RouterUpdate = {
  <TRoute extends ResolvedRoute, TKey extends keyof TRoute['params']>(route: TRoute, paramKey: TKey, paramValue: TRoute['params'][TKey], options?: RouteUpdateOptions): Promise<void>,
  <TRoute extends ResolvedRoute>(route: TRoute, params: Partial<TRoute['params']>, options?: RouteUpdateOptions): Promise<void>,
}

export type RouteUpdate<TRoute extends Route = Route, TParams extends Record<string, Param | undefined> = ExtractRouteParamTypes<TRoute>> = {
  <TKey extends keyof TParams>(key: TKey, value: TParams[TKey], options?: RouteUpdateOptions): Promise<void>,
  (params: Partial<TParams>, options?: RouteUpdateOptions): Promise<void>,
}