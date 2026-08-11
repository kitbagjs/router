import { InjectionKey, reactive } from 'vue'
import { createRouterRoute } from '@/services/createRouterRoute'
import { RouteValueStore } from '@/services/createRouteValueStore'
import { Router, RouterRouteUnion } from '@/types/router'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'

type ResolvedRouteUpdate = (route: ResolvedRoute) => void

type CurrentRouteContext<TRoutes extends Routes = Routes> = {
  currentRoute: ResolvedRoute & WithData,
  routerRoute: RouterRouteUnion<TRoutes>,
  updateRoute: ResolvedRouteUpdate,
}

type CurrentRouteOptions = {
  routerKey: InjectionKey<Router>,
  fallbackRoute: ResolvedRoute,
  push: RouterPush,
  getData: RouteValueStore['getData'],
}

/**
 * The route the router is on. Data is read from the store as a route becomes current, which is the only
 * route whose data anything computes — so a caller hands over whatever it resolved and does not have to
 * know that data is attached at all.
 */
export function createCurrentRoute<TRoutes extends Routes>(options: CurrentRouteOptions): CurrentRouteContext<TRoutes>
export function createCurrentRoute({ routerKey, fallbackRoute, push, getData }: CurrentRouteOptions): CurrentRouteContext {
  const route = reactive(withData(fallbackRoute))

  const updateRoute: ResolvedRouteUpdate = (newRoute) => {
    Object.assign(route, withData(newRoute))
  }

  function withData(route: ResolvedRoute): ResolvedRoute & WithData {
    return {
      ...route,
      data: getData(route),
    }
  }

  const currentRoute = route
  const routerRoute = createRouterRoute(routerKey, currentRoute, push)

  return {
    currentRoute,
    routerRoute,
    updateRoute,
  }
}
