import { App, DeepReadonly } from 'vue'
import { Flattened } from '@/types/flattened'
import { Resolved } from '@/types/resolved'
import { RouteMethods } from '@/types/routeMethods'
import { Route, Routes } from '@/types/routes'
import { AllPropertiesAreOptional, Identity } from '@/types/utilities'

export type RouterOptions = {
  initialUrl?: string,
}

export type RouterPushOptions = {
  // not implemented
  query?: never,
  replace?: boolean,
}

type RoutePushConfigParams<
  TParams
> = TParams extends Record<string, unknown>
  ? AllPropertiesAreOptional<TParams> extends true
    ? { params?: TParams }
    : { params: TParams }
  : {}

export type RouterPushConfig<
  TRoutes extends Routes,
  TFlat = Flattened<TRoutes>
> = Identity<{
  [Route in keyof TFlat]: {
    route: Route,
  } & RoutePushConfigParams<TFlat[Route]>
}[keyof TFlat] & RouterPushOptions>

export type RouterPush<TRoutes extends Routes> = {
  (url: string, options?: RouterPushOptions): Promise<void>,
  (route: RouterPushConfig<TRoutes>): Promise<void>,
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