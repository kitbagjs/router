import { reactive } from 'vue'
import { ResolvedRoute, ResolvedRouteSource } from '@/types/resolved'
import { createResolvedRoute } from '@/utilities/createResolvedRoute'

type ResolvedRouteUpdate = (route: ResolvedRoute) => void

type CurrentRoute = {
  route: ResolvedRoute,
  updateRoute: ResolvedRouteUpdate,
}

export function createCurrentRoute(fallbackRoute: ResolvedRouteSource): CurrentRoute {
  const route = reactive(fallbackRoute)

  const updateRoute: ResolvedRouteUpdate = (newRoute) => {
    Object.assign(route, newRoute)
  }

  return {
    route: createResolvedRoute(route),
    updateRoute,
  }
}