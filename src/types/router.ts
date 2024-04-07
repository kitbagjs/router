import { App, DeepReadonly } from 'vue'
import { AddAfterRouteHook, AddBeforeRouteHook } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { RouterPush, RouterPushImplementation } from '@/types/routerPush'
import { RouterReplace, RouterReplaceImplementation } from '@/types/routerReplace'
import { RouterFind, RouterFindImplementation } from '@/utilities/createRouterFind'
import { RouterHistoryMode } from '@/utilities/createRouterHistory'
import { RouterRejectionComponents, RouterRejectionType } from '@/utilities/createRouterReject'
import { RouterResolve, RouterResolveImplementation } from '@/utilities/createRouterResolve'
import { RouterRoute } from '.'

export type RouterReject = (type: RouterRejectionType) => void

export type RouterOptions = {
  initialUrl?: string,
  historyMode?: RouterHistoryMode,
} & RouterRejectionComponents

export type Router<
  TRoutes extends RouterRoute[] = []
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
  install: (app: App) => void,
  onBeforeRouteEnter: AddBeforeRouteHook,
  onBeforeRouteLeave: AddBeforeRouteHook,
  onBeforeRouteUpdate: AddBeforeRouteHook,
  onAfterRouteEnter: AddAfterRouteHook,
  onAfterRouteLeave: AddAfterRouteHook,
  onAfterRouteUpdate: AddAfterRouteHook,
  initialized: Promise<void>,
}

export type RouterImplementation = {
  route: DeepReadonly<ResolvedRoute>,
  resolve: RouterResolveImplementation,
  push: RouterPushImplementation,
  replace: RouterReplaceImplementation,
  find: RouterFindImplementation,
  reject: RouterReject,
  refresh: () => void,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
  onBeforeRouteEnter: AddBeforeRouteHook,
  onBeforeRouteLeave: AddBeforeRouteHook,
  onBeforeRouteUpdate: AddBeforeRouteHook,
  onAfterRouteEnter: AddAfterRouteHook,
  onAfterRouteLeave: AddAfterRouteHook,
  onAfterRouteUpdate: AddAfterRouteHook,
  initialized: Promise<void>,
}