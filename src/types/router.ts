import { App } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { RouteMethods, RouteMethodsImplementation } from '@/types/routeMethods'
import { Routes } from '@/types/routes'
import { RouterFind, RouterFindImplementation } from '@/utilities/createRouterFind'
import { RouterPush, RouterPushImplementation } from '@/utilities/createRouterPush'
import { RouterReject, RouterRejectionComponents } from '@/utilities/createRouterReject'
import { RouterReplace, RouterReplaceImplementation } from '@/utilities/createRouterReplace'
import { RouterResolve, RouterResolveImplementation } from '@/utilities/createRouterResolve'

export type RouterOptions = {
  initialUrl?: string,
} & RouterRejectionComponents

export type Router<
  TRoutes extends Routes = []
> = {
  routes: RouteMethods<TRoutes>,
  route: ResolvedRoute,
  resolve: RouterResolve<TRoutes>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  find: RouterFind<TRoutes>,
  reject: RouterReject,
  refresh: () => Promise<void>,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
  initialized: Promise<void>,
}

export type RouterImplementation = {
  routes: RouteMethodsImplementation,
  route: ResolvedRoute,
  resolve: RouterResolveImplementation,
  push: RouterPushImplementation,
  replace: RouterReplaceImplementation,
  find: RouterFindImplementation,
  reject: RouterReject,
  refresh: () => Promise<void>,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
  initialized: Promise<void>,
}