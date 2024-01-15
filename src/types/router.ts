import { App, DeepReadonly } from 'vue'
import { Flattened } from '@/types/flattened'
import { Resolved } from '@/types/resolved'
import { RouteMethods } from '@/types/routeMethods'
import { Route, Routes } from '@/types/routes'

export type RouterOptions = {
  initialUrl?: string,
}

export type RouterPushOptions = {
  // not implemented
  query?: never,
  replace?: boolean,
}

type RouterPushRoute<
  TRoutes extends Routes,
  TRoute extends PropertyKey
> = RouterPushOptions & {
  name: TRoute,
  params?: TRoute extends keyof Flattened<TRoutes> ? Flattened<TRoutes>[TRoute] : Record<never, never>,
}

export type RouterPushUrl = (url: string, options?: RouterPushOptions) => Promise<void>

export type RouterPush<TRoutes extends Routes = Routes> = {
  (url: string, options?: RouterPushOptions): Promise<void>,
  <TRoute extends keyof Flattened<TRoutes>>(route: RouterPushRoute<TRoutes, TRoute>): Promise<void>,
}

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

export type RouterReplace = (url: string, options?: RouterReplaceOptions) => Promise<void>

export type Router<
  TRoutes extends Routes = []
> = {
  routes: RouteMethods<TRoutes>,
  route: DeepReadonly<Resolved<Route>>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
}