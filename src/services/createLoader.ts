import { ResolvedRoute } from '@/types/resolved'
import { CreateLoaderOptions, IS_LOADER_SYMBOL, Loader, LoaderInternal } from '@/types/loader'
import { RouteContext } from '@/types/routeContext'

/**
 * Creates a reusable loader that receives the resolved route when an attached route is loaded.
 */
export function createLoader<
  const TContext extends readonly RouteContext[] = [],
  TData = unknown,
  TRoute extends ResolvedRoute = ResolvedRoute
>(options: CreateLoaderOptions<TContext, TData, TRoute>): Loader<TData, TContext>

export function createLoader(options: CreateLoaderOptions<any, any>): Loader<any, any> {
  const context = [...options.context ?? []]
  const internal = {
    [IS_LOADER_SYMBOL]: true,
  } satisfies LoaderInternal

  return { ...options, ...internal, context }
}
