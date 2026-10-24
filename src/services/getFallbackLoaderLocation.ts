import { DEFAULT_LOADER_NAME } from '@/services/addLoader'
import { ValueLocation } from '@/services/getComputations'
import { LoaderInternal } from '@/types/loader'

export function getFallbackLoaderLocation(loader: LoaderInternal): ValueLocation<'loader'> {
  return {
    kind: 'loader',
    id: `fallback-${loader.id}`,
    name: DEFAULT_LOADER_NAME,
  }
}
