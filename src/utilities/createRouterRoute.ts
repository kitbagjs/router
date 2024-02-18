import { reactive } from 'vue'
import { Route } from '@/types'
import { MatchedRouteQuery } from '@/utilities/createRouterRouteQuery'

export type RouterRoute = {
  matched: Route,
  matches: Route[],
  name: string,
  query: MatchedRouteQuery,
  params: Record<string, unknown>,
}

type RouterRouteUpdate = (route: RouterRoute) => void

type CreateRouterRoute = {
  route: RouterRoute,
  updateRoute: RouterRouteUpdate,
}

export function createRouterRoute(fallbackRoute: RouterRoute): CreateRouterRoute {
  const route = reactive<RouterRoute>(fallbackRoute)

  const updateRoute: RouterRouteUpdate = (newRoute) => {
    Object.assign(route, newRoute)
  }

  return {
    route,
    updateRoute,
  }
}