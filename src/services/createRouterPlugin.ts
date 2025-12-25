import { CreateRouterPluginOptions, RouterPlugin, PluginRouteHooks } from '@/types/routerPlugin'
import { createRouteHooks } from './createRouteHooks'
import { Rejection } from '@/types/rejection'
import { Routes } from '@/types/route'

export function createRouterPlugin<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
>(plugin: CreateRouterPluginOptions<TRoutes, TRejections>): RouterPlugin<TRoutes, TRejections> & PluginRouteHooks<TRoutes, TRejections>

export function createRouterPlugin(plugin: CreateRouterPluginOptions): RouterPlugin {
  const { store, ...hooks } = createRouteHooks()

  return {
    routes: plugin.routes ?? [],
    rejections: plugin.rejections ?? [],
    hooks: store,
    ...hooks,
  }
}
