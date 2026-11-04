import { AnyPayloadTransformer } from '@/services/payload'
import { PrefetchConfig, PrefetchConfigOptions } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { AnyFunction } from '@/types/utilities'

export const COMPUTATION_PREFETCH_KEYS = {
  props: 'props',
  loader: 'loaders',
} as const satisfies Record<string, keyof PrefetchConfigOptions>

/**
 * What a stored value is: the props of a view, or the data of a loader. Part of the key so that a view
 * and a loader sharing a name on the same route are still two values.
 */
export type DataKind = keyof typeof COMPUTATION_PREFETCH_KEYS

export function isDataKind(value: unknown): value is DataKind {
  return typeof value === 'string' && Object.hasOwn(COMPUTATION_PREFETCH_KEYS, value)
}

/**
 * Reads are scoped to the computation's navigation and retain the first successful value from its
 * own store or the committed navigation.
 */
export type ComputationContext = {
  to: ResolvedRoute,
  signal: AbortSignal,
  getValue: (location: ValueLocation) => Promise<unknown>,
}

export type Computation = ValueLocation & {
  key: string,
  run: (context: ComputationContext) => unknown,
  routePrefetch: PrefetchConfig | undefined,
  prefetch: PrefetchConfig | undefined,
  transformer: AnyPayloadTransformer | undefined,
}

/**
 * Where a value lives, which is all that is needed to read it back out of a store.
 */
export type ValueLocation<TKind extends DataKind = DataKind> = {
  kind: TKind,
  depth: number,
  name: string,
}

export type CreateComputationOptions<TKind extends DataKind> = {
  location: ValueLocation<TKind>,
  route: ResolvedRoute,
  callback: AnyFunction,
  routePrefetch?: PrefetchConfig,
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}
