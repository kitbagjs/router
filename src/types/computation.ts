import { AnyPayloadTransformer } from '@/services/payload'
import { PrefetchConfig, PrefetchConfigOptions } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { AnyFunction } from '@/types/utilities'

const DATA_KINDS = ['props', 'loader', 'tags'] as const

/**
 * What a stored value is: the props of a view, or the data of a loader. Part of the key so that a view
 * and a loader sharing a name on the same route are still two values.
 */
export type DataKind = typeof DATA_KINDS[number]

export function isDataKind(value: unknown): value is DataKind {
  return DATA_KINDS.some((kind) => kind === value)
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

export type Computation<TContext = ComputationContext> = ValueLocation & {
  key: string,
  prefetchKey: keyof PrefetchConfigOptions,
  run: (context: TContext) => unknown,
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
