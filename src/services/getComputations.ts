import { Computation, DataKind } from '@/types/computation'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { propsLocations } from '@/services/propsLocations'
import { loaderLocations } from '@/services/loaderLocations'
import { createPropsComputation } from '@/services/createPropsComputation'
import { createLoaderComputation } from '@/services/createLoaderComputation'
import { AnyFunction } from '@/types/utilities'
import { getPrefetchOption } from '@/utilities/prefetch'

export function getComputations(route: ResolvedRoute): Computation[] {
  return route.matches.flatMap((match, depth) => {
    const props = propsLocations(match, depth).map((location) => {
      const view = match.views[location.name]

      return createPropsComputation({
        location,
        route,
        callback: view.props as AnyFunction,
        routePrefetch: match.prefetch,
        prefetch: view.prefetch,
        transformer: view.transformer,
      })
    })
    const loaders = loaderLocations(match, depth).map((location) => {
      const loader = match.loaders[location.name]

      return createLoaderComputation({
        location,
        route,
        callback: loader.load,
        routePrefetch: match.prefetch,
        prefetch: loader.prefetch,
        transformer: loader.transformer,
      })
    })

    return [...props, ...loaders]
  })
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
