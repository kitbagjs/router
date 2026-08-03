import { RouteWithMethods } from '@/types/addView'
import { PrefetchConfig } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteCallbackContext } from '@/types/routeCallbackContext'
import { RouteLoader, RouteLoaders } from '@/types/routeLoaders'
import { Url } from '@/types/url'
import { Identity, LastInArray } from '@/types/utilities'

/**
 * The getter for a loader added via `addLoader`. Receives the same two arguments as an `addView` props
 * getter: the resolved route and a context object. Unlike a props getter it can return anything, since
 * nothing binds what it returns to a component.
 */
export type LoaderGetter<
  TRoute extends Route = Route
> = (route: ResolvedRoute<TRoute>, context: RouteCallbackContext<TRoute>) => unknown

/**
 * The options for a loader added via `addLoader`.
 *
 * @template TName - The loader's name, inferred from the `name` option.
 */
export type AddLoaderOptions<
  TName extends string | undefined = string
> = {
  /**
   * The name of the loader, which is the key its data is exposed under on the route. Defaults to the
   * unnamed loader, whose data is exposed as the route's data directly.
   */
  name?: TName,
  /**
   * Determines whether this loader is run when a router-link is rendered for this route. Overrides route
   * level prefetch, and is itself overridden by link level prefetch.
   */
  prefetch?: PrefetchConfig,
}

/**
 * The loaders of the route itself, from the last `matches` entry.
 */
type CurrentMatchLoaders<
  TMatches extends CreatedRouteOptions[]
> = LastInArray<TMatches> extends { loaders: infer TLoaders extends RouteLoaders } ? TLoaders : RouteLoaders

/**
 * Computes the new loaders after adding a loader, replacing any loader the route already stored under
 * the same name.
 */
type AddLoaderLoaders<
  TCurrent extends RouteLoaders,
  TName extends string | undefined,
  TData
> = Identity<Omit<TCurrent, LoaderName<TName>> & Record<LoaderName<TName>, RouteLoader<TData>>> extends infer TNext extends RouteLoaders
  ? TNext
  : TCurrent

type LoaderName<TName extends string | undefined> = TName extends string ? TName : 'default'

/**
 * Replaces the loaders on the last match, preserving all ancestors.
 */
type ReplaceLastMatchLoaders<
  TMatches extends CreatedRouteOptions[],
  TNewLoaders extends RouteLoaders
> = TMatches extends [...infer THead extends CreatedRouteOptions[], infer TLast extends CreatedRouteOptions]
  ? Identity<Omit<TLast, 'loaders'> & { loaders: TNewLoaders }> extends infer TNext extends CreatedRouteOptions
    ? [...THead, TNext]
    : TMatches
  : TMatches

/**
 * The full return type of an `addLoader` call: the same url with the last match's loaders replaced.
 */
type AddLoaderReturn<
  TUrl extends Url,
  TMatches extends CreatedRouteOptions[],
  TNewLoaders extends RouteLoaders
> = ReplaceLastMatchLoaders<TMatches, TNewLoaders> extends infer TNext extends CreatedRouteOptions[]
  ? RouteWithMethods<TUrl, TNext>
  : never

/**
 * Adds a loader to a route. Chainable to register multiple loaders, each exposed under its own name on
 * the resolved route's `data`.
 */
export type RouteAddLoader<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  /**
   * Adds a loader for this route. Loaders never block rendering, so their data is always a promise.
   *
   * @param load - The loader callback. Receives the resolved route and a context object.
   * @param options - The loader's `name` and `prefetch` config.
   */
  addLoader: <
    const TName extends string | undefined = undefined,
    const TGetter extends LoaderGetter<Route<TUrl, TMatches>> = LoaderGetter<Route<TUrl, TMatches>>
  >(
    load: TGetter,
    options?: AddLoaderOptions<TName>,
  ) => AddLoaderReturn<TUrl, TMatches, AddLoaderLoaders<CurrentMatchLoaders<TMatches>, TName, ReturnType<TGetter>>>,
}
