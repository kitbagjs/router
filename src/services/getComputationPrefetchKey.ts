import { COMPUTATION_PREFETCH_KEYS, DataKind } from '@/types/computation'
import { PrefetchConfigOptions } from '@/types/prefetch'

export function getComputationPrefetchKey(kind: DataKind): keyof PrefetchConfigOptions {
  return COMPUTATION_PREFETCH_KEYS[kind]
}
