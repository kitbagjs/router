import { markRaw } from 'vue'
import { LoaderNameConflict } from '@/errors/loaderNameConflict'
import { AnyPayloadTransformer } from '@/services/payload'
import { PrefetchConfig } from '@/types/prefetch'
import { CreatedRouteOptions, Route } from '@/types/route'
import { AnyFunction } from '@/types/utilities'
import { AnyLoader } from '@/types/loader'
import { ResolvedRoute } from '@/types/resolved'
import { RouteCallbackContext } from '@/types/routeCallbackContext'

export const DEFAULT_LOADER_NAME = 'default'

/**
 * The loose runtime shape of the `addLoader` options. Purposely wide: the name type each
 * `RouteAddLoader` describes is refined per route.
 */
type LoaderOptions = {
  name?: string,
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
  params?: (route: ResolvedRoute, context: RouteCallbackContext<Route>) => object,
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

type Loader = {
  name: string,
  load: AnyFunction,
  prefetch: PrefetchConfig | undefined,
  transformer: AnyPayloadTransformer | undefined,
  context: AnyLoader['context'],
}

export function toLoader(source: AnyFunction | AnyLoader, options: LoaderOptions | undefined): Loader {
  const reusable = typeof source !== 'function'
  const load = reusable
    ? (route: ResolvedRoute, context: RouteCallbackContext<Route>) => source.load(options?.params ? options.params(route, context) : route.params, {
        push: context.push,
        replace: context.replace,
        reject: context.reject,
        signal: context.signal,
      })
    : source

  return {
    name: options?.name ?? DEFAULT_LOADER_NAME,
    load,
    prefetch: options?.prefetch ?? (reusable ? source.prefetch : undefined),
    transformer: options?.transformer ?? (reusable ? source.transformer : undefined),
    context: reusable ? source.context : [],
  }
}

/**
 * Returns a new match with the loader merged into its loaders under the loader's name.
 *
 * Matches are `markRaw` so that making a route reactive does not turn its loaders into reactive proxies.
 * Spreading a match drops that, so the rebuilt one is marked again.
 */
export function addLoaderToMatch(match: CreatedRouteOptions, { name, load, prefetch, transformer, context }: Loader): CreatedRouteOptions {
  return markRaw({
    ...match,
    ...context.length ? { context: [...match.context ?? [], ...context] } : {},
    loaders: {
      ...match.loaders,
      [name]: { load, prefetch, transformer },
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
