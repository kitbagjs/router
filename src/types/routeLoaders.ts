import { AnyLoader } from '@/types/loader'
import { AnyFunction } from '@/types/utilities'

/**
 * The loaders for a single route, keyed by loader name (the unnamed loader under 'default').
 */
export type RouteLoaders = Record<string, AnyLoader>

/**
 * The data a set of loaders resolves to. A lone unnamed loader is given directly rather than under a
 * 'default' key, matching how the loader is written. Each loader's data is always a promise, since a
 * loader never blocks rendering, even when the loader itself is synchronous.
 */
export type LoadersDataReturnType<TLoaders> = keyof TLoaders extends never
  ? undefined
  : keyof TLoaders extends 'default'
    ? LoaderData<Extract<TLoaders, { default: unknown }>['default']>
    : { [K in keyof TLoaders]: LoaderData<TLoaders[K]> }

type LoaderData<TLoader> = TLoader extends { load: AnyFunction<infer TData> } ? Promise<Awaited<TData>> : never
