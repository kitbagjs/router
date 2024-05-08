import { DuplicateParamsError } from '@/errors'
import { query } from '@/services/query'
import { MergeParams } from '@/types/params'
import { Query, QueryParams, ToQuery } from '@/types/query'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'
import { StringHasValue, stringHasValue } from '@/utilities/string'

type CombineQueryString<TParent extends string | undefined, TChild extends string | undefined> = StringHasValue<TParent> extends true
  ? StringHasValue<TChild> extends true
    ? `${TParent}&${TChild}`
    : TParent
  : TChild

export type CombineQuery<
  TParent extends Query | undefined,
  TChild extends Query | undefined
> = ToQuery<TParent> extends { query: infer TParentQuery extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToQuery<TChild> extends { query: infer TChildQuery extends string, params: infer TChildParams extends Record<string, unknown> }
    ? MergeParams<TParentParams, TChildParams> extends QueryParams<CombineQueryString<TParentQuery, TChildQuery>>
      ? Query<CombineQueryString<TParentQuery, TChildQuery>, MergeParams<TParentParams, TChildParams>>
      : Query<'', {}>
    : Query<'', {}>
  : Query<'', {}>

export function combineQuery<TParentQuery extends Query, TChildQuery extends Query>(parentQuery: TParentQuery, childQuery: TChildQuery): CombineQuery<TParentQuery, TChildQuery>
export function combineQuery(parentQuery: Query, childQuery: Query): Query {
  const { hasDuplicates, key } = checkDuplicateKeys(parentQuery.params, childQuery.params)
  if (hasDuplicates) {
    throw new DuplicateParamsError(key)
  }

  const newQueryString = [parentQuery.query, childQuery.query]
    .filter(stringHasValue)
    .join('&')

  return query(newQueryString, { ...parentQuery.params, ...childQuery.params })
}