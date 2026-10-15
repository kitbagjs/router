import { AnyLoader, isLoader as isLoaderInternal } from '@/types/loader'

export function isLoader(value: unknown): value is AnyLoader {
  return isLoaderInternal(value)
}
