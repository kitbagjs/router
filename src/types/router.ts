import { App, DeepReadonly } from 'vue'
import { RegisteredRejection } from '@/types/register'
import { Resolved } from '@/types/resolved'
import { RouteMethods, RouteMethodsImplementation } from '@/types/routeMethods'
import { Route, RouteComponent, Routes } from '@/types/routes'
import { RouterPush, RouterPushImplementation, RouterPushOptions } from '@/utilities/createRouterPush'
import { BuiltInRejection, RouterReject } from '@/utilities/createRouterReject'
import { RouterResolve } from '@/utilities/createRouterResolve'

type BuiltInRejectionComponents = Partial<Record<BuiltInRejection, RouteComponent>>

type RouterRejectionComponents = RegisteredRejection extends never
  ? { rejections?: BuiltInRejectionComponents }
  : { rejections: BuiltInRejectionComponents & Record<RegisteredRejection, RouteComponent> }

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
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
}