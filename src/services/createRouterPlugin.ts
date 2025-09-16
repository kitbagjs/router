import { Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
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
