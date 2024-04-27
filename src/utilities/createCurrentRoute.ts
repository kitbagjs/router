import { readonly, reactive } from 'vue'
import { RouterUpdate } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { RouterRoute, createRouterRoute } from '@/utilities/createRouterRoute'

type ResolvedRouteUpdate = (route: ResolvedRoute) => void

type CurrentRouteContext = {
  currentRoute: ResolvedRoute,
  routerRoute: RouterRoute,
  updateRoute: ResolvedRouteUpdate,
}

export function createCurrentRoute(fallbackRoute: ResolvedRoute, update: RouterUpdate): CurrentRouteContext {
  const route = reactive({ ...fallbackRoute })

  const updateRoute: ResolvedRouteUpdate = (newRoute) => {
    Object.assign(route, { ...newRoute })
  }

  return {
    currentRoute: readonly(route),
    routerRoute: createRouterRoute(route, update),
    updateRoute,
  }
}