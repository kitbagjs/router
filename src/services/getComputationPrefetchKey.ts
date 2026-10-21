import { DataKind } from '@/services/getDataKey'
import { PrefetchConfigOptions } from '@/types/prefetch'

const PREFETCH_KEYS: Record<DataKind, keyof PrefetchConfigOptions> = {
  loader: 'loaders',
  props: 'props',
}

export function getComputationPrefetchKey(kind: DataKind): keyof PrefetchConfigOptions {
  return PREFETCH_KEYS[kind]
}
