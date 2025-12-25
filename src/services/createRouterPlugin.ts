import { CreateRouterPluginOptions, RouterPlugin, ToRouterPlugin, PluginRouteHooks } from '@/types/routerPlugin'
import { createRouteHooks } from './createRouteHooks'
import { asArray } from '@/utilities'

export function createRouterPlugin<TPlugin extends CreateRouterPluginOptions>(plugin: TPlugin): ToRouterPlugin<TPlugin> & PluginRouteHooks<TPlugin['routes'], TPlugin['rejections']>

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
