import { CreateRouterPluginOptions, RouterPlugin, PluginRouteHooks, RouterPluginInternal, IS_ROUTER_PLUGIN_SYMBOL } from '@/types/routerPlugin'
import { createRouteHooks } from '@/services/createRouteHooks'
import { Rejections } from '@/types/rejection'
import { Routes } from '@/types/route'

export function createRouterPlugin<
  TRoutes extends Routes = [],
  TRejections extends Rejections = []
>(plugin: CreateRouterPluginOptions<TRoutes, TRejections>): RouterPlugin<TRoutes, TRejections> & PluginRouteHooks<TRoutes, TRejections>

export function createRouterPlugin(options: CreateRouterPluginOptions): RouterPlugin {
  const { store, ...hooks } = createRouteHooks()

  const internal = {
    [IS_ROUTER_PLUGIN_SYMBOL]: true,
    hooks: store,
  } satisfies RouterPluginInternal

  const plugin = {
    routes: options.routes ?? [],
    rejections: options.rejections ?? [],
    ...hooks,
    ...internal,
  } satisfies RouterPlugin & RouterPluginInternal & PluginRouteHooks

  return plugin
}
