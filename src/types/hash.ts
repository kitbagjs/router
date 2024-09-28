import { hash } from '@/services/hash'
import { isRecord } from '@/utilities/guards'

export type Hash<
  THash extends string | undefined = string | undefined
> = {
  value: THash,
  hasValue: () => boolean,
  toString: () => string,
}
export type ToHash<T extends string | Hash | undefined> = T extends string
  ? Hash<T>
  : T extends undefined
    ? Hash<''>
    : unknown extends T
      ? Hash<''>
      : T

function isHash(value: unknown): value is Hash {
  return isRecord(value) && typeof value.hash === 'string'
}

export function toHash<T extends string | Hash | undefined>(value: T): ToHash<T>
export function toHash<T extends string | Hash | undefined>(value: T): Hash {
  if (value === undefined) {
    return hash()
  }

  if (isHash(value)) {
    return value
  }

  return hash(value)
}