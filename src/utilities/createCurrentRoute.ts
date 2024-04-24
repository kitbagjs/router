import { readonly, reactive } from 'vue'
import { ResolvedRoute, RouterRoute } from '@/types/resolved'

type ResolvedRouteUpdate = (route: ResolvedRoute) => void

type CurrentRouteContext = {
  currentRoute: ResolvedRoute,
  routerRoute: RouterRoute,
  updateRoute: ResolvedRouteUpdate,
}

export function createCurrentRoute(fallbackRoute: ResolvedRoute): CurrentRouteContext {
  const route = reactive({ ...fallbackRoute })

  const updateRoute: ResolvedRouteUpdate = (newRoute) => {
    Object.assign(route, { ...newRoute })
  }

  return {
    currentRoute: readonly(route),
    routerRoute: readonly(route),
    updateRoute,
  }
}