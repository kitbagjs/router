import { Computation, ValueLocation, DataKind } from '@/types/computation'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions } from '@/types/route'
import { viewNamesWithProps } from '@/services/routeViews'
import { createPropsComputation } from '@/services/createPropsComputation'
import { createLoaderComputation } from '@/services/createLoaderComputation'
import { createTagsComputation } from '@/services/createTagsComputation'
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

    const tags = tagsLocations(match, depth).map((location) => createTagsComputation({
      location,
      route,
      callback: match.tags as AnyFunction,
      routePrefetch: match.prefetch,
    }))

    return [...props, ...loaders, ...tags]
  })
}

export function getComputationsForStrategy(route: ResolvedRoute, strategy: PrefetchStrategy, configs: PrefetchConfigs): Computation[] {
  return getComputations(route).filter(isStrategy(strategy, configs))
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

export function tagsLocations(match: CreatedRouteOptions, depth: number): ValueLocation<'tags'>[] {
  if (!match.tags) {
    return []
  }

  return [{ kind: 'tags', depth, name: 'tags' }]
}

export function isKind(kind: DataKind): (computation: Computation) => boolean {
  return (computation) => computation.kind === kind
}

export function isStrategy(strategy: PrefetchStrategy, configs: PrefetchConfigs): (computation: Computation) => boolean {
  return (computation) => getPrefetchOption({
    ...configs,
    routePrefetch: computation.routePrefetch,
    viewPrefetch: computation.prefetch,
  }, computation.kind) === strategy
}
