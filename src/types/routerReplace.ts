import { RegisteredRoutes, RouterRoutes } from '@/types'
import { RouterPushOptions } from '@/types/routerPush'
import { RouteWithParams } from '@/types/routeWithParams'

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

export type RouterReplace<
  TRoutes extends RouterRoutes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath>, options?: RouterPushOptions) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
export type RegisteredRouterReplace = RouterReplace<RegisteredRoutes>