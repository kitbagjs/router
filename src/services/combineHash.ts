import { WithParams } from '@/services/withParams'
import { combinePath, CombinePath } from '@/services/combinePath'

export type CombineHash<
  TParent extends WithParams,
  TChild extends WithParams
> = CombinePath<TParent, TChild>

export function combineHash<TParentHash extends WithParams, TChildHash extends WithParams>(parentHash: TParentHash, childHash: TChildHash): CombineHash<TParentHash, TChildHash>
export function combineHash(parentHash: WithParams, childHash: WithParams): WithParams {
  return combinePath(parentHash, childHash)
}
