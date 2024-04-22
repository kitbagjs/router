import { readonly, reactive } from 'vue'
import { ResolvedRoute } from '@/types/resolved'

type ResolvedRouteUpdate = (route: ResolvedRoute) => void

type CurrentRoute = {
  route: ResolvedRoute,
  updateRoute: ResolvedRouteUpdate,
}

export function createCurrentRoute(fallbackRoute: ResolvedRoute): CurrentRoute {
  const route = reactive({ ...fallbackRoute })

  const updateRoute: ResolvedRouteUpdate = (newRoute) => {
    Object.assign(route, { ...newRoute })
  }

  return {
    route: readonly(route),
    updateRoute,
  }
}