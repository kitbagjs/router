import { ComputedRef } from 'vue'

/**
 * Reactive loader state that follows navigation.
 */
type UseLoaderResponse<TData = unknown> = {
  readonly data: ComputedRef<TData | undefined>,
  readonly loading: ComputedRef<boolean>,
  readonly error: ComputedRef<unknown>,
}

/**
 * Reactive loader state that can also be awaited for its initial load to settle.
 */
export type UseLoader<TData = unknown> = UseLoaderResponse<TData> & PromiseLike<UseLoaderResponse<TData>>
