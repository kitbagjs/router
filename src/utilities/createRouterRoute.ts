import { reactive } from 'vue'
import { Resolved, Route } from '@/types'

type RouterRouteUpdate = (matched: Resolved<Route>) => void

type RouterRoute = {
  route: Resolved<Route>,
  updateRoute: RouterRouteUpdate,
}

export function createRouterRoute(fallbackRoute: Resolved<Route>): RouterRoute {
  const route = reactive<Resolved<Route>>(fallbackRoute)

  const updateRoute: RouterRouteUpdate = (newRoute) => {
    Object.assign(route, newRoute)
  }

  return {
    route,
    updateRoute,
  }
}