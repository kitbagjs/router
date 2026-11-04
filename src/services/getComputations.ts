import { Computation, ValueLocation, DataKind } from '@/types/computation'
import type { PrefetchConfig, PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions } from '@/types/route'
import { viewNamesWithProps } from '@/services/routeViews'
import { AnyPayloadTransformer } from '@/services/payload'
import { createRouteComputation } from '@/services/createRouteComputation'
import { AnyFunction } from '@/types/utilities'
import { getPrefetchOption } from '@/utilities/prefetch'
import { getComputationPrefetchKey } from '@/services/getComputationPrefetchKey'

export function getComputations(route: ResolvedRoute): Computation[] {
  return route.matches.flatMap((match, depth) => [
    ...propsLocations(match, depth).map((location) => toComputation(location, match, route, match.views[location.name].props as AnyFunction, match.views[location.name])),
    ...loaderLocations(match, depth).map((location) => toComputation(location, match, route, match.loaders[location.name].load, match.loaders[location.name])),
  ])
}

export function getComputationsForStrategy(route: ResolvedRoute, strategy: PrefetchStrategy, configs: PrefetchConfigs): Computation[] {
  return getComputations(route).filter(isStrategy(strategy, configs))
}

type ComputationOptions = {
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

function toComputation(location: ValueLocation, match: CreatedRouteOptions, route: ResolvedRoute, run: AnyFunction, { prefetch, transformer }: ComputationOptions): Computation {
  return createRouteComputation({
    location,
    route,
    callback: run,
    routePrefetch: match.prefetch,
    prefetch,
    transformer,
  })
}

/**
 * Only views with a getter, since a view with none is never computed and waiting on it would never settle.
 */
export function propsLocations(match: CreatedRouteOptions, depth: number): ValueLocation<'props'>[] {
  return viewNamesWithProps(match.views).map((name) => ({ kind: 'props', depth, name }))
}

export function loaderLocations(match: CreatedRouteOptions, depth: number): ValueLocation<'loader'>[] {
  return Object.keys(match.loaders).map((name) => ({ kind: 'loader', depth, name }))
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
