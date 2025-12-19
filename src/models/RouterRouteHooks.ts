import { RouterAfterRouteHook, RouterBeforeRouteHook, RouterErrorHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Rejection } from '@/types/rejection'

export class RouterRouteHooks<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> {
  public onBeforeRouteEnter = new Set<RouterBeforeRouteHook<TRoutes, TRejections>>()
  public onBeforeRouteUpdate = new Set<RouterBeforeRouteHook<TRoutes, TRejections>>()
  public onBeforeRouteLeave = new Set<RouterBeforeRouteHook<TRoutes, TRejections>>()
  public onAfterRouteEnter = new Set<RouterAfterRouteHook<TRoutes, TRejections>>()
  public onAfterRouteUpdate = new Set<RouterAfterRouteHook<TRoutes, TRejections>>()
  public onAfterRouteLeave = new Set<RouterAfterRouteHook<TRoutes, TRejections>>()
  public onError = new Set<RouterErrorHook<TRoutes, TRejections>>()
}
