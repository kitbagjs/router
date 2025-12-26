import { RouteHookRemove } from './hooks'
import { Routes } from './route'
import { Rejections } from './rejection'
import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { ResolvedRoute } from './resolved'
import { RouterReject } from './routerReject'
import { RouterPush } from './routerPush'
import { RouterReplace } from './routerReplace'
import { CallbackContextAbort } from '@/services/createRouterCallbackContext'
import { MaybePromise } from './utilities'

export type EmptyRouterPlugin = RouterPlugin<[], []>

export type CreateRouterPluginOptions<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = {
  routes?: TRoutes,
  rejections?: TRejections,
}

export type RouterPlugin<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
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
  TRejections extends Rejections
> = {
  from: ResolvedRoute | null,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  abort: CallbackContextAbort,
}

type PluginAfterRouteHookContext<
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  from: ResolvedRoute | null,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
}

export type PluginBeforeRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: ResolvedRoute, context: PluginBeforeRouteHookContext<TRoutes, TRejections>) => MaybePromise<void>

export type PluginAfterRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: ResolvedRoute, context: PluginAfterRouteHookContext<TRoutes, TRejections>) => MaybePromise<void>

type AddPluginBeforeRouteHook<
  TRoutes extends Routes,
  TRejections extends Rejections
> = (hook: PluginBeforeRouteHook<TRoutes, TRejections>) => RouteHookRemove

type AddPluginAfterRouteHook<
  TRoutes extends Routes,
  TRejections extends Rejections
> = (hook: PluginAfterRouteHook<TRoutes, TRejections>) => RouteHookRemove

export type PluginErrorHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
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
  TRejections extends Rejections = Rejections
> = (error: unknown, context: PluginErrorHookContext<TRoutes, TRejections>) => void

export type AddPluginErrorHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: PluginErrorHook<TRoutes, TRejections>) => RouteHookRemove

export type PluginRouteHooks<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
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
