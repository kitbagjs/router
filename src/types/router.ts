import { Plugin } from 'vue'
import { RouterFind } from '@/services/createRouterFind'
import { RouterHistoryMode } from '@/services/createRouterHistory'
import { RouterRejectionComponents, RouterRejectionType } from '@/services/createRouterReject'
import { RouterResolve } from '@/services/createRouterResolve'
import { RouterRoute } from '@/services/createRouterRoute'
import { AddAfterRouteHook, AddBeforeRouteHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'

export type RouterReject = (type: RouterRejectionType) => void

export type RouterOptions = {
  initialUrl?: string,
  historyMode?: RouterHistoryMode,
} & RouterRejectionComponents

export type Router<
  TRoutes extends Routes = any
> = Plugin & {
  route: RouterRoute,
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
}