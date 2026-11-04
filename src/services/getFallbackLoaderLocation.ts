import { ValueLocation } from '@/types/computation'
import { LoaderInternal } from '@/types/loader'

export function getFallbackLoaderLocation(loader: LoaderInternal): ValueLocation<'loader'> {
  return {
    kind: 'loader',
    depth: -1,
    name: loader.id,
  }
}
