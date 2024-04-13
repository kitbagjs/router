import { RegisteredRoutes, RouterRoutes } from '@/types'
import { RouteWithParams } from '@/types/routeWithParams'

export type RouterPushOptions = {
  query?: Record<string, string>,
  replace?: boolean,
}

export type RouterPush<
  TRoutes extends RouterRoutes = []
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath>, options?: RouterPushOptions) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
export type RegisteredRouterPush = RouterPush<RegisteredRoutes>