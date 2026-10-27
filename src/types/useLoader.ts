import { ComputedRef } from 'vue'

/**
 * Reactive loader state that follows navigation.
 */
type UseLoaderResponse<TData = unknown> = {
  readonly data: ComputedRef<TData | undefined>,
  readonly loading: ComputedRef<boolean>,
  readonly error: ComputedRef<unknown>,
}

/** Loader refs returned after the initial data is ready. */
export type UseLoaderResolved<TData = unknown> = {
  readonly data: ComputedRef<TData>,
  readonly loading: ComputedRef<boolean>,
}

export type UseLoader<TData = unknown> = UseLoaderResponse<TData> & PromiseLike<UseLoaderResolved<TData>>
