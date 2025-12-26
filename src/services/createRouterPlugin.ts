import { CreateRouterPluginOptions, RouterPlugin, PluginRouteHooks } from '@/types/routerPlugin'
import { createRouteHooks } from './createRouteHooks'
import { asArray } from '@/utilities'
import { Rejections } from '@/types/rejection'
import { Routes } from '@/types/route'

export function createRouterPlugin<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
>(plugin: CreateRouterPluginOptions<TRoutes, TRejections>): RouterPlugin<TRoutes, TRejections> & PluginRouteHooks<TRoutes, TRejections>

export function createRouterPlugin(plugin: CreateRouterPluginOptions): RouterPlugin {
  const { store, ...hooks } = createRouteHooks()

  asArray(plugin.onBeforeRouteEnter ?? []).forEach((hook) => {
    hooks.onBeforeRouteEnter(hook)
  })

  asArray(plugin.onAfterRouteEnter ?? []).forEach((hook) => {
    hooks.onAfterRouteEnter(hook)
  })

  asArray(plugin.onBeforeRouteUpdate ?? []).forEach((hook) => {
    hooks.onBeforeRouteUpdate(hook)
  })

  asArray(plugin.onAfterRouteUpdate ?? []).forEach((hook) => {
    hooks.onAfterRouteUpdate(hook)
  })

  asArray(plugin.onBeforeRouteLeave ?? []).forEach((hook) => {
    hooks.onBeforeRouteLeave(hook)
  })

  asArray(plugin.onAfterRouteLeave ?? []).forEach((hook) => {
    hooks.onAfterRouteLeave(hook)
  })

  return {
    routes: plugin.routes ?? [],
    rejections: plugin.rejections ?? [],
    hooks: store,
    ...hooks,
  }
}
