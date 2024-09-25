import { StringHasValue, stringHasValue } from '@/utilities/guards'

export type CombineHash<
  TParent extends string | undefined,
  TChild extends string | undefined
> = HashHasValue<TParent> extends true
  ? HashHasValue<TChild> extends true
    ? `${TParent}${TChild}`
    : TParent
  : HashHasValue<TChild> extends true
    ? TChild
    : undefined

type HashHasValue<T> = StringHasValue<T> extends true
  ? string extends T
    ? false
    : true
  : false

export function combineHash<TParentHash extends string | undefined, TChildHash extends string | undefined>(parentHash: TParentHash, childHash: TChildHash): CombineHash<TParentHash, TChildHash>
export function combineHash(parentHash: string | undefined, childHash: string | undefined): string | undefined {
  if (!stringHasValue(parentHash) && !stringHasValue(childHash)) {
    return undefined
  }

  return `${parentHash ?? ''}${childHash ?? ''}`
}