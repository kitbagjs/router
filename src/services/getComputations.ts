import { Computation, DataKind } from '@/types/computation'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { isResolvedRejection, ResolvedRoute } from '@/types/resolved'
import { createPropsComputation } from '@/services/createPropsComputation'
import { getLoaderComputation } from '@/services/getLoaderComputation'
import { getPrefetchOption } from '@/utilities/prefetch'

export function getComputations(route: ResolvedRoute | null): Computation[] {
  const computations: Computation[] = []

  if (!route) {
    return computations
  }

  for (const [depth, match] of route.views.entries()) {
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
  }

  if (!isResolvedRejection(route)) {
    for (const name of Object.keys(route.loaders)) {
      computations.push(getLoaderComputation(route, name))
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
