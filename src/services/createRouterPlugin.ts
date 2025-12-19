import { CreateRouterPluginOptions, RouterPlugin, ToRouterPlugin } from '@/types/routerPlugin'
import { asArray } from '@/utilities/array'

export function createRouterPlugin<TPlugin extends CreateRouterPluginOptions>(plugin: TPlugin): ToRouterPlugin<TPlugin>

export function createRouterPlugin(plugin: CreateRouterPluginOptions): RouterPlugin {
  return {
    routes: plugin.routes ?? [],
    rejections: plugin.rejections ?? [],
    onBeforeRouteEnter: asArray(plugin.onBeforeRouteEnter ?? []),
    onAfterRouteEnter: asArray(plugin.onAfterRouteEnter ?? []),
    onBeforeRouteUpdate: asArray(plugin.onBeforeRouteUpdate ?? []),
    onAfterRouteUpdate: asArray(plugin.onAfterRouteUpdate ?? []),
    onBeforeRouteLeave: asArray(plugin.onBeforeRouteLeave ?? []),
    onAfterRouteLeave: asArray(plugin.onAfterRouteLeave ?? []),
  }
}
