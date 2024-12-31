import { Routes } from '@/types/route'
import { Router } from '@/types/router'
import { RouterPlugin } from '@/types/routerPlugin'
import { asArray } from '@/utilities/array'
import { Component } from 'vue'

export function createRouterPlugin<
  TRoutes extends Routes = [],
  TRejections extends Record<string, Component> = {}
>(plugin: Partial<RouterPlugin<TRoutes, TRejections>>): RouterPlugin<TRoutes, TRejections> {
  return {
    routes: plugin.routes ?? [] as unknown as TRoutes,
    rejections: plugin.rejections ?? {} as TRejections,
    ...plugin,
  }
}

export function addRouterPluginHooks(router: Router, plugin: RouterPlugin): void {
  if (plugin.onBeforeRouteEnter) {
    asArray(plugin.onBeforeRouteEnter).forEach((hook) => router.onBeforeRouteEnter(hook))
  }

  if (plugin.onAfterRouteEnter) {
    asArray(plugin.onAfterRouteEnter).forEach((hook) => router.onAfterRouteEnter(hook))
  }

  if (plugin.onBeforeRouteUpdate) {
    asArray(plugin.onBeforeRouteUpdate).forEach((hook) => router.onBeforeRouteUpdate(hook))
  }

  if (plugin.onAfterRouteUpdate) {
    asArray(plugin.onAfterRouteUpdate).forEach((hook) => router.onAfterRouteUpdate(hook))
  }

  if (plugin.onBeforeRouteLeave) {
    asArray(plugin.onBeforeRouteLeave).forEach((hook) => router.onBeforeRouteLeave(hook))
  }

  if (plugin.onAfterRouteLeave) {
    asArray(plugin.onAfterRouteLeave).forEach((hook) => router.onAfterRouteLeave(hook))
  }
}
