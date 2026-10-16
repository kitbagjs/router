import { InjectionKey } from 'vue'
import { Router } from '@/types/router'
import { RouteLoaders } from '@/types/routeLoaders'
import { AnyFunction } from '@/types/utilities'

export const IS_LOADER_HANDLE_SYMBOL = Symbol('IS_LOADER_HANDLE_SYMBOL')

/**
 * A named loader attachment whose data follows the current navigation.
 */
export type LoaderHandle<TData = unknown> = {
  readonly name: string,
  readonly data: Promise<TData>,
}

export type LoaderHandleInternal = {
  [IS_LOADER_HANDLE_SYMBOL]: true,
  matchId: string,
  routerKey: InjectionKey<Router>,
}

export type LoaderHandles<TLoaders extends RouteLoaders> = {
  readonly [K in keyof TLoaders]: TLoaders[K] extends { load: AnyFunction<infer TData> }
    ? LoaderHandle<Awaited<TData>>
    : never
}

export function isLoaderHandle(value: unknown): value is LoaderHandle & LoaderHandleInternal {
  return typeof value === 'object' && value !== null && IS_LOADER_HANDLE_SYMBOL in value
}
