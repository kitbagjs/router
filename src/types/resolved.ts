import { markRaw } from 'vue'
import { Param } from '@/types/params'
import { Route } from '@/types/routes'

export const isRejectionRouteSymbol = Symbol()
export const routeDepthSymbol = Symbol()

export type Resolved<T extends Route> = {
  matched: T,
  matches: Route[],
  name: string,
  path: string,
  query: string,
  params: Record<string, Param[]>,
  [routeDepthSymbol]: number,
  [isRejectionRouteSymbol]?: true,
}

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
    [isRejectionRouteSymbol]: route.isRejection,
  }
}

export function getRoutIsRejection(route: Resolved<Route>): boolean {
  return Boolean(route[isRejectionRouteSymbol])
}

export function getRouteDepth(route: Resolved<Route>): number {
  return route[routeDepthSymbol]
}