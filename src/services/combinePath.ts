import { RemoveLeadingQuestionMarkFromKeys } from '@/types/params'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'
import { EmptyWithParams, ParamsWithParamNameExtracted, ToWithParams, WithParams } from '@/services/withParams'

export type CombinePath<
  TParent extends WithParams,
  TChild extends WithParams
> = ToWithParams<TParent> extends { value: infer TParentPath extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToWithParams<TChild> extends { value: infer TChildPath extends string, params: infer TChildParams extends Record<string, unknown> }
    ? RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams> extends ParamsWithParamNameExtracted<`${TParentPath}${TChildPath}`>
      ? WithParams<`${TParentPath}${TChildPath}`, RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams>>
      : EmptyWithParams
    : EmptyWithParams
  : EmptyWithParams

export function combinePath<TParentPath extends WithParams, TChildPath extends WithParams>(parentPath: TParentPath, childPath: TChildPath): CombinePath<TParentPath, TChildPath>
export function combinePath(parentPath: WithParams, childPath: WithParams): WithParams {
  checkDuplicateParams(parentPath.params, childPath.params)

  const newPathString = `${parentPath.value}${childPath.value}`

  return {
    value: newPathString,
    params: { ...parentPath.params, ...childPath.params },
  }
}
