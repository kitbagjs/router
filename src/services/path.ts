import { getParamsForString } from '@/services/getParamsForString'
import { Path, PathParams } from '@/types/path'
import { Identity } from '@/types/utilities'

export function path<T extends string, P extends PathParams<T>>(path: T, params: Identity<P>): Path<T, P> {
  return {
    path,
    params: getParamsForString(path, params) as Path<T, P>['params'],
    toString: () => path,
  }
}