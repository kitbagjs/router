import { CreateLoaderOptions, IS_LOADER_SYMBOL, Loader } from '@/types/loader'
import { RouteContext } from '@/types/routeContext'

/**
 * Creates a reusable loader that receives the resolved route when an attached route is loaded.
 */
export function createLoader<
  const TContext extends readonly RouteContext[] = [],
  TData = unknown
>(options: CreateLoaderOptions<TContext, TData>): Loader<TData, TContext>

export function createLoader(options: CreateLoaderOptions<any, any>): Loader<any, any> {
  return { ...options, [IS_LOADER_SYMBOL]: true, context: [...options.context ?? []] }
}
