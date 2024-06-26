import { reactive } from 'vue'
import { createRouterRoute } from '@/services/createRouterRoute'
import { RouterRoutes } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'

type ResolvedRouteUpdate = (route: ResolvedRoute) => void

type CurrentRouteContext<TRoutes extends Routes = Routes> = {
  currentRoute: ResolvedRoute,
  routerRoute: RouterRoutes<TRoutes>,
  updateRoute: ResolvedRouteUpdate,
}

export function createCurrentRoute<TRoutes extends Routes>(fallbackRoute: ResolvedRoute, push: RouterPush): CurrentRouteContext<TRoutes>
export function createCurrentRoute(fallbackRoute: ResolvedRoute, push: RouterPush): CurrentRouteContext {
  const route = reactive({ ...fallbackRoute })

  const updateRoute: ResolvedRouteUpdate = (newRoute) => {
    Object.assign(route, { ...newRoute })
  }

  const currentRoute = route
  const routerRoute = createRouterRoute(currentRoute, push)

  return {
    currentRoute,
    routerRoute,
    updateRoute,
  }
}