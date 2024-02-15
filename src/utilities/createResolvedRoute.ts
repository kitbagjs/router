import { markRaw } from 'vue'
import { Route, Param, Resolved, routeDepthSymbol, isRejectionSymbol } from '@/types'

type ResolvedRouteProperties<T extends Route> = {
  matched: T,
  matches: Route[],
  name: string,
  path: string,
  query: string,
  params: Record<string, Param[]>,
  depth: number,
  isRejection?: true,
}

export function createResolvedRoute<T extends Route>(route: ResolvedRouteProperties<T>): Resolved<T> {
  return {
    matched: markRaw(route.matched),
    matches: markRaw(route.matches),
    name: route.name,
    path: route.path,
    query: route.query,
    params: route.params,
    [routeDepthSymbol]: route.depth,
    [isRejectionSymbol]: route.isRejection,
  }
}

export function getRouteIsRejection(route: Resolved<Route>): boolean {
  return Boolean(route[isRejectionSymbol])
}

export function getRouteDepth(route: Resolved<Route>): number {
  return route[routeDepthSymbol]
}