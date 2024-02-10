import { DeepReadonly, reactive, readonly } from 'vue'
import { Resolved, Route } from '@/types'
import { notFoundRouteResolved } from '@/utilities/createRouterReject'

type RouterRouteUpdate = (matched: Resolved<Route>) => void

type RouterRoute = {
  route: DeepReadonly<Resolved<Route>>,
  updateRoute: RouterRouteUpdate,
}

export function createRouterRoute(): RouterRoute {
  const route = reactive<Resolved<Route>>({ ...notFoundRouteResolved })

  const updateRoute: RouterRouteUpdate = (newRoute) => {
    Object.assign(route, newRoute)
  }

  return {
    route: readonly(route),
    updateRoute,
  }
}