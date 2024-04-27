import { Param } from '@/types/params'
import { ExtractRouteParamTypes, Route } from '@/types/route'

export type RouteUpdateOptions = {
  query?: Record<string, string>,
  replace?: boolean,
}

export type RouterUpdate = (params: Partial<Record<string, unknown>>, options?: RouteUpdateOptions) => Promise<void>

export type RouteUpdate<TRoute extends Route = Route, TParams extends Record<string, Param | undefined> = ExtractRouteParamTypes<TRoute>> = {
  <TKey extends keyof TParams>(key: TKey, value: TParams[TKey], options?: RouteUpdateOptions): Promise<void>,
  (params: Partial<TParams>, options?: RouteUpdateOptions): Promise<void>,
}