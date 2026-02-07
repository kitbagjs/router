import { UrlPart } from '@/services/withParams'
import { combinePath, CombinePath } from '@/services/combinePath'

export type CombineHash<
  TParent extends UrlPart,
  TChild extends UrlPart
> = CombinePath<TParent, TChild>

export function combineHash<TParentHash extends UrlPart, TChildHash extends UrlPart>(parentHash: TParentHash, childHash: TChildHash): CombineHash<TParentHash, TChildHash>
export function combineHash(parentHash: UrlPart, childHash: UrlPart): UrlPart {
  return combinePath(parentHash, childHash)
}
