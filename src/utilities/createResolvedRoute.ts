import { markRaw } from 'vue'
import { Route, Param, Resolved } from '@/types'

type ResolvedRouteProperties<T extends Route> = {
  matched: T,
  matches: Route[],
  name: string,
  path: string,
  query: string,
  params: Record<string, Param[]>,
  depth: number,
  isRejection: boolean,
}

export function createResolvedRoute<T extends Route>(route: ResolvedRouteProperties<T>): Resolved<T> {
  return {
    matched: markRaw(route.matched),
    matches: markRaw(route.matches),
    name: route.name,
    path: route.path,
    query: route.query,
    params: route.params,
    depth: route.depth,
    isRejection: route.isRejection,
  }
}