import { AnyPayloadTransformer, TransformerOptions } from '@/services/payload'
import { PrefetchConfig } from '@/types/prefetch'
import { RouteContext, RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { RouterPush } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { AnyFunction } from '@/types/utilities'
import { Register } from '@/types/register'
import { ResolvedRoute, RouterResolvedRouteUnion } from '@/types/resolved'
import { Router, RouterRoutes } from '@/types/router'

export const IS_LOADER_SYMBOL = Symbol('IS_LOADER_SYMBOL')

/**
 * The resolved routes a reusable loader can receive, narrowed by the registered router when available.
 */
export type LoaderRoute<TRegister = Register> = TRegister extends { router: infer TRouter extends Router }
  ? RouterResolvedRouteUnion<RouterRoutes<TRouter>>
  : ResolvedRoute

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
  TData = unknown
> = TransformerOptions<NoInfer<Awaited<TData>>> & {
  /**
   * Loads a value or promise from the resolved route.
   */
  load: (route: LoaderRoute, context: LoaderCallbackContext<TContext>) => TData,
  /**
   * Related routes and rejections, also included in the attached route's context.
   */
  context?: TContext,
  /**
   * Default prefetch behavior, overridable when attaching the loader.
   */
  prefetch?: PrefetchConfig,
}

/**
 * A reusable loader definition, with its context normalized to an array.
 */
export type Loader<
  TContext extends readonly RouteContext[] = [],
  TData = unknown
> = TransformerOptions<Awaited<TData>> & {
  [IS_LOADER_SYMBOL]: true,
  load: AnyFunction<TData>,
  context: TContext,
  prefetch?: PrefetchConfig,
}

/**
 * The runtime shape after a loader's route, context, and return types have been erased.
 */
export type AnyLoader = {
  [IS_LOADER_SYMBOL]: true,
  load: AnyFunction,
  context: readonly RouteContext[],
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

/**
 * Determines whether a value is a reusable loader created by `createLoader`.
 */
export function isLoader(value: unknown): value is AnyLoader {
  return typeof value === 'object' && value !== null && IS_LOADER_SYMBOL in value
}
