import { BeforeRouteHook, AfterRouteHook } from './hooks'
import { Routes } from './route'
import { MaybeArray } from './utilities'
import { Rejection } from './rejection'

export type EmptyRouterPlugin = RouterPlugin<[], []>

export type ToRouterPlugin<TPlugin extends CreateRouterPluginOptions> = TPlugin extends { routes: infer TRoutes extends Routes }
  ? TPlugin extends { rejections: infer TRejections extends Rejection[] }
    ? RouterPlugin<TRoutes, TRejections>
    : RouterPlugin<TRoutes, []>
  : TPlugin extends { rejections: infer TRejections extends Rejection[] }
    ? RouterPlugin<[], TRejections>
    : RouterPlugin<[], []>

export type CreateRouterPluginOptions = {
  routes?: Routes,
  rejections?: Rejection[],
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}

export type RouterPlugin<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  routes: TRoutes,
  rejections: TRejections,
  onBeforeRouteEnter: BeforeRouteHook[],
  onAfterRouteEnter: AfterRouteHook[],
  onBeforeRouteUpdate: BeforeRouteHook[],
  onAfterRouteUpdate: AfterRouteHook[],
  onBeforeRouteLeave: BeforeRouteHook[],
  onAfterRouteLeave: AfterRouteHook[],
}
