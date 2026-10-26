import { ComputedRef } from 'vue'

/**
 * Reactive loader state that follows navigation.
 */
export type UseLoader<TData = unknown> = {
  readonly data: ComputedRef<TData | undefined>,
  readonly loading: ComputedRef<boolean>,
  readonly error: ComputedRef<unknown>,
}
