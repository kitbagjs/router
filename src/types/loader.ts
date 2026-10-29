import { Rejections } from '@/types/rejection'
import { TransformerOptions } from '@/services/payload'
import { PrefetchConfig } from '@/types/prefetch'
import { CallbackRoutes, ContextRejections, ContextRoutes, RouteContext } from '@/types/routeContext'
import { RouterPush } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { AnyFunction } from '@/types/utilities'
import { ResolvedRouteUnion } from '@/types/resolved'
import { Routes } from '@/types/route'

export const IS_LOADER_SYMBOL = Symbol('IS_LOADER_SYMBOL')

export type LoaderInternal = {
  [IS_LOADER_SYMBOL]: true,
  id: string,
}

/**
 * Navigation helpers available to a reusable loader, typed from its router and declared context.
 */
export type LoaderCallbackContext<
  TContext extends readonly RouteContext[] = [],
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = []
> = {
  push: RouterPush<ContextRoutes<TContext, TRoutes>>,
  replace: RouterReplace<ContextRoutes<TContext, TRoutes>>,
  reject: RouterReject<ContextRejections<TContext, TRejections>>,
  signal: AbortSignal,
}

/**
 * Options for a reusable loader that receives the resolved route and navigation helpers.
 */
export type CreateLoaderOptions<
  TContext extends readonly RouteContext[] = [],
  TData = unknown,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = []
> = TransformerOptions<NoInfer<Awaited<TData>>> & {
  /**
   * Loads a value or promise from the resolved route.
   */
  load: (route: ResolvedRouteUnion<CallbackRoutes<ContextRoutes<TContext, TRoutes>>[number]>, context: LoaderCallbackContext<TContext, TRoutes, TRejections>) => TData,
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
export type CreateLoader<TRoutes extends Routes = Routes, TRejections extends Rejections = []> = <
  const TContext extends readonly RouteContext[] = [],
  TData = unknown
>(options: CreateLoaderOptions<TContext, TData, TRoutes, TRejections>) => Loader<TData, TContext>

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
 * A loader definition with the name assigned when attached to a route.
 */
export type NamedLoader = AnyLoader & {
  name: string,
}

/**
 * Determines whether a value is a reusable loader created by `createLoader`.
 */
export function isLoader(value: unknown): value is AnyLoader & LoaderInternal {
  return typeof value === 'object' && value !== null && IS_LOADER_SYMBOL in value
}
