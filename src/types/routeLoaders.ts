import { PrefetchConfig } from '@/types/prefetch'
import { AnyFunction } from '@/types/utilities'

/**
 * A single loader: how to load its data, and how to prefetch it. Unlike a view, a loader always has a
 * getter — a loader without one would have nothing to contribute.
 *
 * @template TData - What this loader's getter returns, carried so a route's data can be typed from it.
 */
export type RouteLoader<TData = unknown> = {
  load: AnyFunction<TData>,
  prefetch?: PrefetchConfig,
}

/**
 * The loaders for a single route, keyed by loader name (the unnamed loader under 'default').
 */
export type RouteLoaders = Record<string, RouteLoader>

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
