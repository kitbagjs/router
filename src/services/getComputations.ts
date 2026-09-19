import { PropsGetter } from '@/types/createRouteOptions'
import type { PrefetchConfig } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions } from '@/types/route'
import { viewNamesWithProps } from '@/services/createRouteViews'
import { DataKind, getDataKey } from '@/services/createNavigationStores'
import { AnyFunction } from '@/types/utilities'

/**
 * Something a route computes: a view's props getter, or a loader. Both are a named callback belonging to
 * one match, so both are stored the same way — what differs is only what waits on them.
 */
export type Computation = {
  kind: DataKind,
  id: string,
  name: string,
  depth: number,
  key: string,
  run: AnyFunction,
  routePrefetch: PrefetchConfig | undefined,
  prefetch: PrefetchConfig | undefined,
}

/**
 * Where a value lives, which is all that is needed to read it back out of a store.
 */
export type ValueLocation = {
  kind: DataKind,
  id: string,
  name: string,
}

export function getComputations(route: ResolvedRoute): Computation[] {
  return route.matches.flatMap((match, depth) => [
    ...propsLocations(match).map((location) => toComputation(location, match, depth, route, match.views[location.name].props as PropsGetter, match.views[location.name].prefetch)),
    ...loaderLocations(match).map((location) => toComputation(location, match, depth, route, match.loaders[location.name].load, match.loaders[location.name].prefetch)),
  ])
}

function toComputation(location: ValueLocation, match: CreatedRouteOptions, depth: number, route: ResolvedRoute, run: AnyFunction, prefetch: PrefetchConfig | undefined): Computation {
  return {
    ...location,
    depth,
    key: getDataKey(location.kind, location.id, location.name, route),
    run,
    routePrefetch: match.prefetch,
    prefetch,
  }
}

/**
 * Only views with a getter, since a view with none is never computed and waiting on it would never settle.
 */
export function propsLocations(match: CreatedRouteOptions): ValueLocation[] {
  return viewNamesWithProps(match.views).map((name) => ({ kind: 'props', id: match.id, name }))
}

export function loaderLocations(match: CreatedRouteOptions): ValueLocation[] {
  return Object.keys(match.loaders).map((name) => ({ kind: 'loader', id: match.id, name }))
}

export function isKind(kind: DataKind): (computation: Computation) => boolean {
  return (computation) => computation.kind === kind
}
