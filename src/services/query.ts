import { getParamsForString } from '@/services/getParamsForString'
import { Query, QueryParams } from '@/types/query'
import { Identity } from '@/types/utilities'

export function query<T extends string, P extends QueryParams<T>>(query: T, params: Identity<P>): Query<T, P> {
  return {
    query,
    params: getParamsForString(query, params) as Query<T, P>['params'],
    toString: () => query,
  }
}