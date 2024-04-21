import { DeepReadonly, Plugin } from 'vue'
import { AddAfterRouteHook, AddBeforeRouteHook } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RouterFind } from '@/utilities/createRouterFind'
import { RouterHistoryMode } from '@/utilities/createRouterHistory'
import { RouterRejectionComponents, RouterRejectionType } from '@/utilities/createRouterReject'
import { RouterResolve } from '@/utilities/createRouterResolve'

export type RouterReject = (type: RouterRejectionType) => void

export type RouterOptions = {
  initialUrl?: string,
  historyMode?: RouterHistoryMode,
} & RouterRejectionComponents

export type Router<
  TRoutes extends Routes = []
> = {
  route: DeepReadonly<ResolvedRoute>,
  resolve: RouterResolve<TRoutes>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  find: RouterFind<TRoutes>,
  reject: RouterReject,
  refresh: () => void,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  onBeforeRouteEnter: AddBeforeRouteHook,
  onBeforeRouteLeave: AddBeforeRouteHook,
  onBeforeRouteUpdate: AddBeforeRouteHook,
  onAfterRouteEnter: AddAfterRouteHook,
  onAfterRouteLeave: AddAfterRouteHook,
  onAfterRouteUpdate: AddAfterRouteHook,
  initialized: Promise<void>,
} & Plugin