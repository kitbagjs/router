import { markRaw } from 'vue'
import { CreateLoaderOptions, IS_LOADER_SYMBOL, Loader } from '@/types/loader'
import { RouteContext } from '@/types/routeContext'

/** Creates a reusable loader that can be attached to routes providing its required params. */
export function createLoader<
  TParams extends object = {},
  const TContext extends readonly RouteContext[] = [],
  TData = unknown
>(options: CreateLoaderOptions<TParams, TContext, TData>): Loader<TParams, TContext, TData>

export function createLoader(options: CreateLoaderOptions<any, any, any>): Loader<any, any, any> {
  return markRaw({ ...options, [IS_LOADER_SYMBOL]: true, context: [...options.context ?? []] })
}
