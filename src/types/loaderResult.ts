import { ComputedRef } from 'vue'

/**
 * Reactive loader state that follows navigation.
 */
export type LoaderState<TData = unknown> = {
  readonly data: ComputedRef<TData | undefined>,
  readonly loading: ComputedRef<boolean>,
  readonly error: ComputedRef<unknown>,
}

/**
 * Reactive loader state that can also be awaited for its initial load.
 */
export type LoaderResult<TData = unknown> = LoaderState<TData> & PromiseLike<LoaderState<TData>>
