import { Routes } from '@/types/route'
import { CreateLoaderOptions, IS_LOADER_SYMBOL, Loader, LoaderInternal } from '@/types/loader'
import { RouteContext } from '@/types/routeContext'

/**
 * Creates a reusable loader that receives the resolved route when an attached route is loaded.
 */
export function createLoader<
  const TContext extends readonly RouteContext[] = [],
  TData = unknown,
  TRoutes extends Routes = Routes
>(options: CreateLoaderOptions<TContext, TData, TRoutes>): Loader<TData, TContext>

export function createLoader(options: CreateLoaderOptions<any, any>): Loader<any, any> {
  const context = [...options.context ?? []]
  const internal = {
    [IS_LOADER_SYMBOL]: true,
  } satisfies LoaderInternal

  return { ...options, ...internal, context }
}
