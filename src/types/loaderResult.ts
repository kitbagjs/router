import { ComputedRef } from 'vue'

/**
 * Reactive loader state that can also be awaited for the current load's data.
 */
export type LoaderResult<TData = unknown> = PromiseLike<TData> & {
  readonly data: ComputedRef<TData | undefined>,
  readonly loading: ComputedRef<boolean>,
  readonly error: ComputedRef<unknown>,
}
