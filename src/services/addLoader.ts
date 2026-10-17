import { markRaw } from 'vue'
import { LoaderNameConflict } from '@/errors/loaderNameConflict'
import { AnyPayloadTransformer } from '@/services/payload'
import { PrefetchConfig } from '@/types/prefetch'
import { CreatedRouteOptions, Route } from '@/types/route'
import { AnyFunction } from '@/types/utilities'
import { AnyLoader, isLoader } from '@/types/loader'
import { combineContext } from '@/services/combineContext'
import { createLoader } from '@/services/createLoader'

export const DEFAULT_LOADER_NAME = 'default'

/**
 * The loose runtime shape of the `addLoader` options. Purposely wide: the name type each
 * `RouteAddLoader` describes is refined per route.
 */
type LoaderOptions = {
  name?: string,
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

/**
 * The runtime arguments accepted by `addLoader`.
 */
type AddLoaderParameters = [load: AnyFunction | AnyLoader, options?: LoaderOptions]

/**
 * The loose runtime signature of the `addLoader` method. Purposely wide: it returns Route rather than the
 * refined chainable route each `RouteAddLoader` overload describes.
 */
export type AddLoader = (...args: AddLoaderParameters) => Route

type NamedLoader = AnyLoader & { name: string }

export function toLoader(source: AnyFunction | AnyLoader, options: LoaderOptions | undefined): NamedLoader {
  if (typeof source === 'function') {
    return toLoader(createLoader({ load: source }), options)
  }

  if (!isLoader(source)) {
    throw new TypeError('Expected a loader created by createLoader')
  }

  return {
    ...source,
    name: options?.name ?? DEFAULT_LOADER_NAME,
    prefetch: options?.prefetch ?? source.prefetch,
    transformer: options?.transformer ?? source.transformer,
  }
}

/**
 * Returns a new match with the loader merged into its loaders under the loader's name.
 *
 * Matches are `markRaw` so that making a route reactive does not turn its loaders into reactive proxies.
 * Spreading a match drops that, so the rebuilt one is marked again.
 */
export function addLoaderToMatch(match: CreatedRouteOptions, loader: NamedLoader): CreatedRouteOptions {
  return markRaw({
    ...match,
    context: combineContext(match.context, loader.context),
    loaders: {
      ...match.loaders,
      [loader.name]: loader,
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
