import { App, DeepReadonly } from 'vue'
import { AddBeforeRouteHook } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { RouteMethods, RouteMethodsImplementation } from '@/types/routeMethods'
import { RouterPush, RouterPushImplementation } from '@/types/routerPush'
import { RouterReplace, RouterReplaceImplementation } from '@/types/routerReplace'
import { Routes } from '@/types/routes'
import { RouterFind, RouterFindImplementation } from '@/utilities/createRouterFind'
import { RouterHistoryMode } from '@/utilities/createRouterHistory'
import { RouterRejectionComponents, RouterRejectionType } from '@/utilities/createRouterReject'
import { RouterResolve, RouterResolveImplementation } from '@/utilities/createRouterResolve'

export type RouterReject = (type: RouterRejectionType) => void

export type RouterOptions = {
  initialUrl?: string,
  historyMode?: RouterHistoryMode,
} & RouterRejectionComponents

export type Router<
  TRoutes extends Routes = []
> = {
  routes: RouteMethods<TRoutes>,
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
  initialized: Promise<void>,
}

export type RouterImplementation = {
  routes: RouteMethodsImplementation,
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
  initialized: Promise<void>,
}