import { reactive } from 'vue'
import { RouterRoute, createRouterRoute } from '@/services/createRouterRoute'
import { ResolvedRoute } from '@/types/resolved'
import { RouterPush } from '@/types/routerPush'

type ResolvedRouteUpdate = (route: ResolvedRoute) => void

type CurrentRouteContext = {
  currentRoute: ResolvedRoute,
  routerRoute: RouterRoute,
  updateRoute: ResolvedRouteUpdate,
}

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