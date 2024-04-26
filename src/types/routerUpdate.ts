import { ResolvedRoute } from '@/types/resolved'

export type RouteUpdateOptions = {
  replace?: boolean,
}

export type RouterUpdate = {
  <TRoute extends ResolvedRoute, TKey extends keyof TRoute['params']>(route: TRoute, paramKey: TKey, paramValue: TRoute['params'][TKey], options?: RouteUpdateOptions): Promise<void>,
  <TRoute extends ResolvedRoute>(route: TRoute, params: Partial<TRoute['params']>, options?: RouteUpdateOptions): Promise<void>,
}

export type RouteUpdate<TRoute extends ResolvedRoute = ResolvedRoute> = {
  <TKey extends keyof TRoute['params']>(key: TKey, value: TRoute['params'][TKey], options?: RouteUpdateOptions): Promise<void>,
  (params: Partial<TRoute['params']>, options?: RouteUpdateOptions): Promise<void>,
}