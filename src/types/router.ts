import { App, DeepReadonly } from 'vue'
import { Resolved } from '@/types/resolved'
import { RouteMethods } from '@/types/routeMethods'
import { Route, Routes } from '@/types/routes'
import { RouterPush, RouterPushOptions } from '@/utilities/createRouterPush'

export type RouterOptions = {
  initialUrl?: string,
}

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

// todo this type should mirror RouterPush
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