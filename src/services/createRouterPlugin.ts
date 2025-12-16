import { Rejection } from '@/types/rejection'
import { Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'

export function createRouterPlugin<
  TRoutes extends Routes = [],
  TRejections extends Rejection[] = []
>(plugin: Partial<RouterPlugin<TRoutes, TRejections>>): RouterPlugin<TRoutes, TRejections> {
  return {
    routes: plugin.routes ?? [] as unknown as TRoutes,
    rejections: plugin.rejections ?? {} as TRejections,
    ...plugin,
  }
}
