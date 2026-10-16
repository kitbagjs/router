import { TransformerOptions } from '@/services/payload'
import { PrefetchConfig } from '@/types/prefetch'
import { RouteContext, RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { RouterPush } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { AnyFunction } from '@/types/utilities'
import { ResolvedRouteUnion } from '@/types/resolved'
import { Routes } from '@/types/route'

export const IS_LOADER_SYMBOL = Symbol('IS_LOADER_SYMBOL')
export const LOADER_ID_SYMBOL = Symbol('LOADER_ID_SYMBOL')

export type LoaderInternal = {
  [IS_LOADER_SYMBOL]: true,
  [LOADER_ID_SYMBOL]: symbol,
}

/**
 * Navigation helpers available to a reusable loader, typed from its declared context.
 */
export type LoaderCallbackContext<TContext extends readonly RouteContext[] = []> = {
  push: RouterPush<RouteContextToRoute<[...TContext]>>,
  replace: RouterReplace<RouteContextToRoute<[...TContext]>>,
  reject: RouterReject<RouteContextToRejection<[...TContext]>>,
  signal: AbortSignal,
}

/**
 * Options for a reusable loader that receives the resolved route and its declared context helpers.
 */
export type CreateLoaderOptions<
  TContext extends readonly RouteContext[] = [],
  TData = unknown,
  TRoutes extends Routes = Routes
> = TransformerOptions<NoInfer<Awaited<TData>>> & {
  /**
   * Loads a value or promise from the resolved route.
   */
  load: (route: ResolvedRouteUnion<TRoutes[number]>, context: LoaderCallbackContext<TContext>) => TData,
  /**
   * See [Context](https://kitbag-router.netlify.app/advanced-concepts/context).
   */
  context?: TContext,
  /**
   * Default prefetch behavior, overridable when attaching the loader.
   */
  prefetch?: PrefetchConfig,
}

/**
 * Creates loaders with callbacks typed to the router's resolved routes.
 */
export type CreateLoader<TRoutes extends Routes = Routes> = <
  const TContext extends readonly RouteContext[] = [],
  TData = unknown
>(options: CreateLoaderOptions<TContext, TData, TRoutes>) => Loader<TData, TContext>

/**
 * A reusable loader definition, with its context normalized to an array.
 */
export type Loader<
  TData = unknown,
  TContext extends readonly RouteContext[] = []
> = TransformerOptions<Awaited<TData>> & {
  load: AnyFunction<TData>,
  context: TContext,
  prefetch?: PrefetchConfig,
}

/**
 * The runtime shape after a loader's route, context, and return types have been erased.
 */
export type AnyLoader = Loader<any, readonly RouteContext[]>

/**
 * Determines whether a value is a reusable loader created by `createLoader`.
 */
export function isLoader(value: unknown): value is AnyLoader & LoaderInternal {
  return typeof value === 'object' && value !== null && IS_LOADER_SYMBOL in value
}
