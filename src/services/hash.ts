import { Hash } from '@/types/hash'
import { stringHasValue } from '@/utilities/guards'

export function hash<THash extends string>(hash?: THash): Hash<THash>
export function hash(hash?: string): Hash {
  const value = !stringHasValue(hash) ? undefined : hash.replace(/^#/, '')

  function hasValue(): boolean {
    return value !== undefined
  }

  function toString(): string {
    if (hasValue()) {
      return `#${hash}`
    }

    return ''
  }

  return {
    value,
    hasValue,
    toString,
  }
}
