import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'
import { stringHasValue } from '@/utilities/guards'
import { ToUrlPart, UrlPart, UrlParams } from '@/services/withParams'

export type CombineQuery<
  TParent extends UrlPart,
  TChild extends UrlPart
> = ToUrlPart<TParent> extends { params: infer TParentParams extends UrlParams }
  ? ToUrlPart<TChild> extends { params: infer TChildParams extends UrlParams }
    ? TParentParams & TChildParams extends UrlParams
      ? UrlPart<TParentParams & TChildParams>
      : UrlPart<{}>
    : UrlPart<{}>
  : UrlPart<{}>

export function combineQuery<TParentQuery extends UrlPart, TChildQuery extends UrlPart>(parentQuery: TParentQuery, childQuery: TChildQuery): CombineQuery<TParentQuery, TChildQuery>
export function combineQuery(parentQuery: UrlPart, childQuery: UrlPart): UrlPart {
  checkDuplicateParams(parentQuery.params, childQuery.params)

  const newQueryString = [parentQuery.value, childQuery.value]
    .filter(stringHasValue)
    .join('&')

  return {
    ...parentQuery,
    value: newQueryString,
    params: { ...parentQuery.params, ...childQuery.params },
  }
}
