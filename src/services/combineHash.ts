import { hash } from '@/services/hash'
import { Hash, ToHash } from '@/types/hash'

export type CombineHash<
  TParent extends Hash,
  TChild extends Hash
> = ToHash<TParent> extends { value: infer TParentHash extends string }
  ? ToHash<TChild> extends { value: infer ChildHash extends string }
    ? Hash<`${TParentHash}${ChildHash}`>
    : TParent
  : Hash

export function combineHash<TParentHash extends Hash, TChildHash extends Hash>(parentHash: TParentHash, childHash: TChildHash): CombineHash<TParentHash, TChildHash>
export function combineHash(parentHash: Hash, childHash: Hash): Hash {
  return hash(`${parentHash.value ?? ''}${childHash.value ?? ''}`)
}