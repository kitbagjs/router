import { markRaw } from 'vue'
import { LoaderNameConflict } from '@/errors/loaderNameConflict'
import { PrefetchConfig } from '@/types/prefetch'
import { CreatedRouteOptions, Route } from '@/types/route'
import { AnyFunction } from '@/types/utilities'

export const DEFAULT_LOADER_NAME = 'default'

/**
 * The loose runtime shape of the `addLoader` options. Purposely wide: the name type each
 * `RouteAddLoader` describes is refined per route.
 */
type LoaderOptions = {
  name?: string,
  prefetch?: PrefetchConfig,
}

/**
 * The runtime arguments accepted by `addLoader`.
 */
type AddLoaderParameters = [load: AnyFunction, options?: LoaderOptions]

/**
 * The loose runtime signature of the `addLoader` method. Purposely wide: it returns Route rather than the
 * refined chainable route each `RouteAddLoader` overload describes.
 */
export type AddLoader = (...args: AddLoaderParameters) => Route

type Loader = {
  name: string,
  load: AnyFunction,
  prefetch: PrefetchConfig | undefined,
}

export function toLoader(load: AnyFunction, options: LoaderOptions | undefined): Loader {
  return {
    name: options?.name ?? DEFAULT_LOADER_NAME,
    load,
    prefetch: options?.prefetch,
  }
}

/**
 * Returns a new match with the loader merged into its loaders under the loader's name.
 *
 * Matches are `markRaw` so that making a route reactive does not turn its loaders into reactive proxies.
 * Spreading a match drops that, so the rebuilt one is marked again.
 */
export function addLoaderToMatch(match: CreatedRouteOptions, { name, load, prefetch }: Loader): CreatedRouteOptions {
  return markRaw({
    ...match,
    loaders: {
      ...match.loaders,
      [name]: { load, prefetch },
    },
  })
}

/**
 * A route's data combines the loaders of every match, so a name an ancestor already uses would be
 * ambiguous. Adding a loader the route itself already has is an override, and allowed.
 */
export function checkForLoaderConflict(ancestors: CreatedRouteOptions[], name: string): void {
  if (ancestors.some((ancestor) => name in ancestor.loaders)) {
    throw new LoaderNameConflict(name)
  }
}
