import { Routes } from '@/types/route'
import { RouterAfterRouteHook, RouterBeforeRouteHook } from '@/types/router'

export class RouterRouteHooks<TRoutes extends Routes = Routes> {
  public onBeforeRouteEnter = new Set<RouterBeforeRouteHook<TRoutes>>()
  public onBeforeRouteUpdate = new Set<RouterBeforeRouteHook<TRoutes>>()
  public onBeforeRouteLeave = new Set<RouterBeforeRouteHook<TRoutes>>()
  public onAfterRouteEnter = new Set<RouterAfterRouteHook<TRoutes>>()
  public onAfterRouteUpdate = new Set<RouterAfterRouteHook<TRoutes>>()
  public onAfterRouteLeave = new Set<RouterAfterRouteHook<TRoutes>>()
}
