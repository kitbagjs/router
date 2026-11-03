import type { PrefetchConfig, PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions } from '@/types/route'
import { viewNamesWithProps } from '@/services/routeViews'
import { DataKind } from '@/services/getDataKey'
import { AnyPayloadTransformer } from '@/services/payload'
import { DataRecord } from '@/types/data'
import { DataResult } from '@/services/createDataStore'
import { CallbackContextResponse } from '@/types/callbackContext'
import { createRouteComputation } from '@/services/createRouteComputation'
import { AnyFunction } from '@/types/utilities'
import { getPrefetchOption } from '@/utilities/prefetch'
import { getComputationPrefetchKey } from '@/services/getComputationPrefetchKey'

/**
 * Reads are scoped to the computation's navigation. Subscriptions prefer a local computation and fall
 * back to the committed navigation when missing. Value reads retain the first successful source.
 */
export type ComputationContext = {
  to: ResolvedRoute,
  signal: AbortSignal,
  getState: (location: ValueLocation) => DataResult,
  subscribe: (location: ValueLocation) => Promise<CallbackContextResponse>,
  getValue: (location: ValueLocation) => Promise<unknown>,
  getValues: (locations: readonly ValueLocation[]) => DataRecord,
}

export type Computation = {
  kind: DataKind,
  id: string,
  name: string,
  depth: number,
  key: string,
  run: (context: ComputationContext) => unknown,
  routePrefetch: PrefetchConfig | undefined,
  prefetch: PrefetchConfig | undefined,
  transformer: AnyPayloadTransformer | undefined,
}

/**
 * Where a value lives, which is all that is needed to read it back out of a store.
 */
export type ValueLocation<TKind extends DataKind = DataKind> = {
  kind: TKind,
  id: string,
  name: string,
}

export function getComputations(route: ResolvedRoute): Computation[] {
  return route.matches.flatMap((match, depth) => [
    ...propsLocations(match).map((location) => toComputation(location, match, depth, route, match.views[location.name].props as AnyFunction, match.views[location.name])),
    ...loaderLocations(match).map((location) => toComputation(location, match, depth, route, match.loaders[location.name].load, match.loaders[location.name])),
  ])
}

export function getComputationsForStrategy(route: ResolvedRoute, strategy: PrefetchStrategy, configs: PrefetchConfigs): Computation[] {
  return getComputations(route).filter(isStrategy(strategy, configs))
}

type ComputationOptions = {
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

function toComputation(location: ValueLocation, match: CreatedRouteOptions, depth: number, route: ResolvedRoute, run: AnyFunction, { prefetch, transformer }: ComputationOptions): Computation {
  return createRouteComputation({
    location,
    route,
    depth,
    callback: run,
    routePrefetch: match.prefetch,
    prefetch,
    transformer,
  })
}

/**
 * Only views with a getter, since a view with none is never computed and waiting on it would never settle.
 */
export function propsLocations(match: CreatedRouteOptions): ValueLocation<'props'>[] {
  return viewNamesWithProps(match.views).map((name) => ({ kind: 'props', id: match.id, name }))
}

export function loaderLocations(match: CreatedRouteOptions): ValueLocation<'loader'>[] {
  return Object.keys(match.loaders).map((name) => ({ kind: 'loader', id: match.id, name }))
}

export function isKind(kind: DataKind): (computation: Computation) => boolean {
  return (computation) => computation.kind === kind
}

export function isStrategy(strategy: PrefetchStrategy, configs: PrefetchConfigs): (computation: Computation) => boolean {
  return (computation) => getPrefetchOption({
    ...configs,
    routePrefetch: computation.routePrefetch,
    viewPrefetch: computation.prefetch,
  }, getComputationPrefetchKey(computation.kind)) === strategy
}
