import { ResolvedRoute } from '@/types/resolved'

export type RouteUpdateOptions = {
  query?: Record<string, string>,
  replace?: boolean,
}

export type RouterUpdate = (params: Partial<Record<string, unknown>>, options?: RouteUpdateOptions) => Promise<void>

export type RouteUpdate<TRoute extends ResolvedRoute = ResolvedRoute> = {
  <TKey extends keyof TRoute['params']>(key: TKey, value: TRoute['params'][TKey], options?: RouteUpdateOptions): Promise<void>,
  (params: Partial<TRoute['params']>, options?: RouteUpdateOptions): Promise<void>,
}