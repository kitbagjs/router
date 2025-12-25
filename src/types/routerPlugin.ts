import { BeforeRouteHook, AfterRouteHook, RouteHookRemove } from './hooks'
import { Routes } from './route'
import { MaybeArray, MaybePromise } from './utilities'
import { Rejection } from './rejection'
import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { ResolvedRoute } from './resolved'
import { RouterReject } from './routerReject'
import { RouterPush } from './routerPush'
import { RouterReplace } from './routerReplace'
import { CallbackContextAbort } from '@/services/createRouterCallbackContext'

export type EmptyRouterPlugin = RouterPlugin<[], []>

export type CreateRouterPluginOptions<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  routes?: TRoutes,
  rejections?: TRejections,
  /**
   * @deprecated use plugin.onBeforeRouteEnter instead
   */
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  /**
   * @deprecated use plugin.onAfterRouteEnter instead
   */
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  /**
   * @deprecated use plugin.onBeforeRouteUpdate instead
   */
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  /**
   * @deprecated use plugin.onAfterRouteUpdate instead
   */
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  /**
   * @deprecated use plugin.onBeforeRouteLeave instead
   */
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  /**
   * @deprecated use plugin.onAfterRouteLeave instead
   */
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}

export type RouterPlugin<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  /**
   * The routes supplied by the plugin.
   * @internal
  */
  routes: TRoutes,
  /**
  * The rejections supplied by the plugin.
   * @internal
   */
  rejections: TRejections,
  /**
   * The hooks supplied by the plugin.
   * @internal
   */
  hooks: RouterRouteHooks,
}

type PluginBeforeRouteHookContext<
  TRoutes extends Routes,
  TRejections extends Rejection[]
> = {
  from: ResolvedRoute | null,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  abort: CallbackContextAbort,
}

type PluginAfterRouteHookContext<
  TRoutes extends Routes,
  TRejections extends Rejection[]
> = {
  from: ResolvedRoute | null,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
}

export type PluginBeforeRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (to: ResolvedRoute, context: PluginBeforeRouteHookContext<TRoutes, TRejections>) => MaybePromise<void>

export type PluginAfterRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (to: ResolvedRoute, context: PluginAfterRouteHookContext<TRoutes, TRejections>) => MaybePromise<void>

type AddPluginBeforeRouteHook<
  TRoutes extends Routes,
  TRejections extends Rejection[]
> = (hook: PluginBeforeRouteHook<TRoutes, TRejections>) => RouteHookRemove

type AddPluginAfterRouteHook<
  TRoutes extends Routes,
  TRejections extends Rejection[]
> = (hook: PluginAfterRouteHook<TRoutes, TRejections>) => RouteHookRemove

export type PluginErrorHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  to: ResolvedRoute,
  from: ResolvedRoute | null,
  source: 'props' | 'hook' | 'component',
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
}

export type PluginErrorHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (error: unknown, context: PluginErrorHookContext<TRoutes, TRejections>) => void

export type AddPluginErrorHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (hook: PluginErrorHook<TRoutes, TRejections>) => RouteHookRemove

export type PluginRouteHooks<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  /**
   * Registers a global hook to be called before a route is entered.
   */
  onBeforeRouteEnter: AddPluginBeforeRouteHook<TRoutes, TRejections>,
  /**
   * Registers a global hook to be called before a route is left.
   */
  onBeforeRouteLeave: AddPluginBeforeRouteHook<TRoutes, TRejections>,
  /**
   * Registers a global hook to be called before a route is updated.
   */
  onBeforeRouteUpdate: AddPluginBeforeRouteHook<TRoutes, TRejections>,
  /**
   * Registers a global hook to be called after a route is entered.
   */
  onAfterRouteEnter: AddPluginAfterRouteHook<TRoutes, TRejections>,
  /**
   * Registers a global hook to be called after a route is left.
   */
  onAfterRouteLeave: AddPluginAfterRouteHook<TRoutes, TRejections>,
  /**
   * Registers a global hook to be called after a route is updated.
   */
  onAfterRouteUpdate: AddPluginAfterRouteHook<TRoutes, TRejections>,
  /**
   * Registers a global hook to be called when an error occurs.
   */
  onError: AddPluginErrorHook<TRoutes, TRejections>,
}
