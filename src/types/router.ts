import { App, DeepReadonly } from 'vue'
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

export type RouterPush = {
  (url: string, options?: RouterPushOptions): Promise<void>,
}

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

export type RouterReplace = (url: string, options?: RouterReplaceOptions) => Promise<void>

export type Router<
  TRoutes extends Routes = []
> = {
  routes: RouteMethods<TRoutes>,
  route: DeepReadonly<Resolved<Route>>,
  push: RouterPush,
  replace: RouterReplace,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
}