import { Hash } from '@/types/hash'
import { stringHasValue } from '@/utilities/guards'

export function hash<THash extends string>(hash?: THash): Hash<THash>
export function hash(hash?: string): Hash {
  const value = !stringHasValue(hash) ? undefined : hash.replace(/^#*/, '')

  return {
    value,
  }
}
