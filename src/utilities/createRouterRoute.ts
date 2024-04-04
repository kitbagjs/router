import { markRaw } from 'vue'
import { Route, Param, RouterRoute } from '@/types'

type RouterRouteProperties = {
  matched: Route,
  matches: Route[],
  name: string,
  path: string,
  query: string,
  pathParams: Record<string, Param>,
  queryParams: Record<string, Param>,
  depth: number,
}

export function createRouterRoute(route: RouterRouteProperties): RouterRoute {
  return {
    matched: markRaw(route.matched),
    matches: markRaw(route.matches),
    name: route.name,
    path: route.path,
    query: route.query,
    pathParams: route.pathParams,
    queryParams: route.queryParams,
    depth: route.depth,
  }
}