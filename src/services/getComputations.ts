import { Computation, DataKind } from '@/types/computation'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { createPropsComputation } from '@/services/createPropsComputation'
import { createLoaderComputation } from '@/services/createLoaderComputation'
import { getPrefetchOption } from '@/utilities/prefetch'

export function getComputations(route: ResolvedRoute): Computation[] {
  const computations: Computation[] = []

  for (const [depth, match] of route.matches.entries()) {
    for (const [name, { props, prefetch, transformer }] of Object.entries(match.views)) {
      if (!props) {
        continue
      }

      computations.push(createPropsComputation({
        location: { kind: 'props', depth, name },
        route,
        callback: props,
        routePrefetch: match.prefetch,
        prefetch,
        transformer,
      }))
    }

    for (const [name, { load, prefetch, transformer }] of Object.entries(match.loaders)) {
      computations.push(createLoaderComputation({
        location: { kind: 'loader', depth, name },
        route,
        callback: load,
        routePrefetch: match.prefetch,
        prefetch,
        transformer,
      }))
    }
  }

  return computations
}

export function getComputationsForStrategy(route: ResolvedRoute, strategy: PrefetchStrategy, configs: PrefetchConfigs): Computation[] {
  return getComputations(route).filter(isStrategy(strategy, configs))
}

export function isKind(kind: DataKind): (computation: Computation) => boolean {
  return (computation) => computation.kind === kind
}

export function isStrategy(strategy: PrefetchStrategy, configs: PrefetchConfigs): (computation: Computation) => boolean {
  return (computation) => getPrefetchOption({
    ...configs,
    routePrefetch: computation.routePrefetch,
    viewPrefetch: computation.prefetch,
  }, computation.prefetchKey) === strategy
}
