import { AnyLoader, Loader } from '@/types/loader'
import { AnyFunction } from '@/types/utilities'

/**
 * The loaders for a single route, keyed by loader name (the unnamed loader under 'default').
 */
export type RouteLoaders = Record<string, AnyLoader>

/**
 * Legacy loader results unwrap a lone default loader; named loaders expose promises keyed by name.
 */
export type LoadersDataReturnType<TLoaders> = keyof TLoaders extends never
  ? undefined
  : keyof TLoaders extends 'default'
    ? LoaderData<Extract<TLoaders, { default: unknown }>['default']>
    : { [K in keyof TLoaders]: LoaderData<TLoaders[K]> }

type LoaderData<TLoader> = TLoader extends { load: AnyFunction<infer TData> } ? Promise<Awaited<TData>> : never

/**
 * Reads a loader by name. Omitting the name selects `default` when declared.
 */
export type GetData<TLoaders extends RouteLoaders = Record<string, Loader>> = <TName extends keyof TLoaders & string = Extract<'default', keyof TLoaders>>(
  ...args: TName extends 'default' ? [name?: TName] : [name: TName]
) => Promise<Awaited<ReturnType<TLoaders[TName]['load']>>>
