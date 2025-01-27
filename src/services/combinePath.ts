import { RemoveLeadingQuestionMarkFromKeys } from '@/types/params'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'
import { EmptyWithParams, ParamsWithParamNameExtracted, ToWithParams, withParams, WithParams } from '@/services/withParams'
import { StringHasValue } from '@/utilities/guards'

type CombinePathString<TParent extends string | undefined, TChild extends string | undefined> =
  StringHasValue<TParent> extends true
    ? StringHasValue<TChild> extends true
      ? `${TParent}${TChild}`
      : TParent
    : TChild

export type CombinePath<
  TParent extends WithParams,
  TChild extends WithParams
> = ToWithParams<TParent> extends { value: infer TParentPath extends string | undefined, params: infer TParentParams extends Record<string, unknown> }
  ? ToWithParams<TChild> extends { value: infer TChildPath extends string | undefined, params: infer TChildParams extends Record<string, unknown> }
    ? RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams> extends ParamsWithParamNameExtracted<CombinePathString<TParentPath, TChildPath>>
      ? WithParams<CombinePathString<TParentPath, TChildPath>, RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams>>
      : EmptyWithParams
    : EmptyWithParams
  : EmptyWithParams

export function combinePath<TParentPath extends WithParams, TChildPath extends WithParams>(parentPath: TParentPath, childPath: TChildPath): CombinePath<TParentPath, TChildPath>
export function combinePath(parentPath: WithParams, childPath: WithParams): WithParams {
  checkDuplicateParams(parentPath.params, childPath.params)

  const newPathString = `${parentPath}${childPath}`

  return withParams(newPathString, { ...parentPath.params, ...childPath.params })
}
