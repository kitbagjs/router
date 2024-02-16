import { reactive } from 'vue'
import { Resolved } from '@/types'

type RouterRouteUpdate = (matched: Resolved) => void

type RouterRoute = {
  route: Resolved,
  updateRoute: RouterRouteUpdate,
}

export function createRouterRoute(fallbackRoute: Resolved): RouterRoute {
  const route = reactive<Resolved>(fallbackRoute)

  const updateRoute: RouterRouteUpdate = (newRoute) => {
    Object.assign(route, newRoute)
  }

  return {
    route,
    updateRoute,
  }
}