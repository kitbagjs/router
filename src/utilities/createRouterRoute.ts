import { reactive } from 'vue'
import { ResolvedRoute } from '@/types'

type RouterRouteUpdate = (matched: ResolvedRoute) => void

type RouterRoute = {
  route: ResolvedRoute,
  updateRoute: RouterRouteUpdate,
}

export function createRouterRoute(fallbackRoute: ResolvedRoute): RouterRoute {
  const route = reactive<ResolvedRoute>(fallbackRoute)

  const updateRoute: RouterRouteUpdate = (newRoute) => {
    Object.assign(route, newRoute)
  }

  return {
    route,
    updateRoute,
  }
}