import { App, DeepReadonly } from 'vue'
import { RouteMethods, RouteMethodsImplementation } from '@/types/routeMethods'
import { Routes } from '@/types/routes'
import { RouterPush, RouterPushImplementation } from '@/utilities/createRouterPush'
import { RouterReject, RouterRejectionComponents } from '@/utilities/createRouterReject'
import { RouterReplace, RouterReplaceImplementation } from '@/utilities/createRouterReplace'
import { RouterResolve, RouterResolveImplementation } from '@/utilities/createRouterResolve'
import { RouterRoute } from '@/utilities/createRouterRoute'

export type RouterOptions = {
  initialUrl?: string,
} & RouterRejectionComponents

export type Router<
  TRoutes extends Routes = []
> = {
  routes: RouteMethods<TRoutes>,
  route: DeepReadonly<RouterRoute>,
  resolve: RouterResolve<TRoutes>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
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
  route: DeepReadonly<RouterRoute>,
  resolve: RouterResolveImplementation,
  push: RouterPushImplementation,
  replace: RouterReplaceImplementation,
  reject: RouterReject,
  refresh: () => Promise<void>,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
  initialized: Promise<void>,
}