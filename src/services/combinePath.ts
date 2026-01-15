import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'
import { ToWithParams, withParams, WithParams } from '@/services/withParams'
import { Param } from '@/types/paramTypes'

type CombinePathString<TParent extends string, TChild extends string> = `${TParent}${TChild}`

export type CombinePath<
  TParent extends WithParams,
  TChild extends WithParams
> = ToWithParams<TParent> extends { value: infer TParentPath extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToWithParams<TChild> extends { value: infer TChildPath extends string, params: infer TChildParams extends Record<string, unknown> }
    ? TParentParams & TChildParams extends Record<string, Param | undefined>
      ? WithParams<CombinePathString<TParentPath, TChildPath>, TParentParams & TChildParams>
      : WithParams<CombinePathString<TParentPath, TChildPath>, {}>
    : WithParams<'', {}>
  : WithParams<'', {}>

export function combinePath<TParentPath extends WithParams, TChildPath extends WithParams>(parentPath: TParentPath, childPath: TChildPath): CombinePath<TParentPath, TChildPath>
export function combinePath(parentPath: WithParams, childPath: WithParams): WithParams {
  checkDuplicateParams(parentPath.params, childPath.params)

  const newPathString = `${parentPath.value}${childPath.value}`

  return withParams(newPathString, { ...parentPath.params, ...childPath.params })
}
