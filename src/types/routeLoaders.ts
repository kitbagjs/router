import { AnyLoader } from '@/types/loader'
import { AnyFunction } from '@/types/utilities'

/**
 * The loaders for a single route, keyed by loader name (the unnamed loader under 'default').
 */
export type RouteLoaders = Record<string, AnyLoader>

/**
 * The data exposed by context.parent.data. A lone unnamed loader is given directly rather than under a
 * 'default' key, matching how the loader is written. Each loader's data is always a promise, since a
 * loader never blocks rendering, even when the loader itself is synchronous.
 */
export type LoadersDataReturnType<TLoaders> = keyof TLoaders extends never
  ? undefined
  : keyof TLoaders extends 'default'
    ? LoaderData<Extract<TLoaders, { default: unknown }>['default']>
    : { [K in keyof TLoaders]: LoaderData<TLoaders[K]> }

type LoaderData<TLoader> = TLoader extends { load: AnyFunction<infer TData> } ? Promise<Awaited<TData>> : never

/**
 * Loader promises keyed by name, including the unnamed loader under `default`.
 */
export type LoadersData<TLoaders extends RouteLoaders> = {
  [TName in keyof TLoaders]: LoaderData<TLoaders[TName]>
}

export type LoaderDataRecord = Record<string, Promise<unknown>>

/**
 * Reads one loader by name. Omitting the name selects the default loader when one is declared.
 */
export type GetData<TData extends LoaderDataRecord = LoaderDataRecord> = <TName extends keyof TData & string = Extract<'default', keyof TData>>(
  ...args: TName extends 'default' ? [name?: TName] : [name: TName]
) => TData[TName]
