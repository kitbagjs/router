import { readonly, reactive } from 'vue'
import { RouterPush } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { RouterRoute, createRouterRoute } from '@/utilities/createRouterRoute'

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

  const currentRoute = readonly(route)
  const routerRoute = createRouterRoute(currentRoute, push)

  return {
    currentRoute,
    routerRoute,
    updateRoute,
  }
}