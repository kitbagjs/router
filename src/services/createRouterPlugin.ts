import { CreateRouterPluginOptions, RouterPlugin, PluginRouteHooks } from '@/types/routerPlugin'
import { createHooksFactory } from '@/services/createHooksFactory'
import { Rejections } from '@/types/rejection'
import { Routes } from '@/types/route'

export function createRouterPlugin<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
>(plugin: CreateRouterPluginOptions<TRoutes, TRejections>): RouterPlugin<TRoutes, TRejections> & PluginRouteHooks<TRoutes, TRejections>

export function createRouterPlugin(plugin: CreateRouterPluginOptions): RouterPlugin {
  const { store, ...hooks } = createHooksFactory()

  return {
    routes: plugin.routes ?? [],
    rejections: plugin.rejections ?? [],
    hooks: store,
    ...hooks,
  }
}
