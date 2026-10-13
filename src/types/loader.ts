import { AnyPayloadTransformer, TransformerOptions } from '@/services/payload'
import { PrefetchConfig } from '@/types/prefetch'
import { RouteContext, RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { RouterPush } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { AnyFunction } from '@/types/utilities'

/** Navigation helpers available to a reusable loader, typed from its declared context. */
export type LoaderCallbackContext<TContext extends readonly RouteContext[] = []> = {
  push: RouterPush<RouteContextToRoute<[...TContext]>>,
  replace: RouterReplace<RouteContextToRoute<[...TContext]>>,
  reject: RouterReject<RouteContextToRejection<[...TContext]>>,
  signal: AbortSignal,
}

/** Options for a reusable loader. Params are declared by annotating the callback's first argument. */
export type CreateLoaderOptions<
  TParams extends object = {},
  TContext extends readonly RouteContext[] = [],
  TData = unknown
> = TransformerOptions<NoInfer<Awaited<TData>>> & {
  /** Loads a value or promise from the params supplied by the attached route. */
  load: (params: TParams, context: LoaderCallbackContext<TContext>) => TData,
  /** Related routes and rejections, also included in the attached route's context. */
  context?: TContext,
  /** Default prefetch behavior, overridable when attaching the loader. */
  prefetch?: PrefetchConfig,
}

/** A reusable loader definition, with its context normalized to an array. */
export type Loader<
  TParams extends object = {},
  TContext extends readonly RouteContext[] = [],
  TData = unknown
> = CreateLoaderOptions<TParams, TContext, TData> & { context: TContext }

/** The runtime shape after a loader's param, context, and return types have been erased. */
export type AnyLoader = {
  load: AnyFunction,
  context: readonly RouteContext[],
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}
