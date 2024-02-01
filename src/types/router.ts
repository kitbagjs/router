import { App, DeepReadonly } from 'vue'
import { Resolved } from '@/types/resolved'
import { RouteMethods, RouteMethodsImplementation } from '@/types/routeMethods'
import { Route, Routes } from '@/types/routes'
import { RouterPush, RouterPushImplementation, RouterPushOptions } from '@/utilities/createRouterPush'
import { RouterReject, RouterRejectionComponents } from '@/utilities/createRouterReject'
import { RouterResolve } from '@/utilities/createRouterResolve'

export type RouterOptions = {
  initialUrl?: string,
} & RouterRejectionComponents

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

// todo this type should mirror RouterPush
export type RouterReplace = (url: string, options?: RouterReplaceOptions) => Promise<void>

export type Router<
  TRoutes extends Routes = []
> = {
  routes: RouteMethods<TRoutes>,
  route: DeepReadonly<Resolved<Route>>,
  resolve: RouterResolve,
  push: RouterPush<TRoutes>,
  replace: RouterReplace,
  reject: RouterReject,
  refresh: () => Promise<void>,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
}

export type RouterImplementation = {
  routes: RouteMethodsImplementation,
  route: DeepReadonly<Resolved<Route>>,
  resolve: RouterResolve,
  push: RouterPushImplementation,
  replace: RouterReplace,
  reject: RouterReject,
  refresh: () => Promise<void>,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
}