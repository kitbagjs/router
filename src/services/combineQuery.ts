import { RemoveLeadingQuestionMarkFromKeys } from '@/types/params'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'
import { StringHasValue, stringHasValue } from '@/utilities/guards'
import { ToWithParams, withParams, WithParams } from '@/services/withParams'
import { Param } from '@/types/paramTypes'

type CombineQueryString<TParent extends string | undefined, TChild extends string | undefined> =
  StringHasValue<TParent> extends true
    ? StringHasValue<TChild> extends true
      ? `${TParent}&${TChild}`
      : TParent
    : TChild

export type CombineQuery<
  TParent extends WithParams,
  TChild extends WithParams
> = ToWithParams<TParent> extends { value: infer TParentQuery extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToWithParams<TChild> extends { value: infer TChildQuery extends string, params: infer TChildParams extends Record<string, unknown> }
    ? RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams> extends Record<string, Param | undefined>
      ? WithParams<CombineQueryString<TParentQuery, TChildQuery>, RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams>>
      : WithParams<CombineQueryString<TParentQuery, TChildQuery>, {}>
    : WithParams<'', {}>
  : WithParams<'', {}>

export function combineQuery<TParentQuery extends WithParams, TChildQuery extends WithParams>(parentQuery: TParentQuery, childQuery: TChildQuery): CombineQuery<TParentQuery, TChildQuery>
export function combineQuery(parentQuery: WithParams, childQuery: WithParams): WithParams {
  checkDuplicateParams(parentQuery.params, childQuery.params)

  const newQueryString = [parentQuery.value, childQuery.value]
    .filter(stringHasValue)
    .join('&')

  return withParams(newQueryString, { ...parentQuery.params, ...childQuery.params })
}
