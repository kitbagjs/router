import { Param, Identity, MergeParams, ExtractParamName, ExtractPathParamType } from '@/types'
import { getParamsForString } from '@/utilities/getParamsForString'
import { isRecord } from '@/utilities/guards'

type ParamEnd = '/'

type ExtractParamsFromPathString<
  TPath extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = TPath extends `${infer Path}${ParamEnd}`
  ? ExtractParamsFromPathString<Path, TParams>
  : TPath extends `${string}:${infer Param}${ParamEnd}${infer Rest}`
    ? MergeParams<{ [P in ExtractParamName<Param>]: ExtractPathParamType<Param, TParams> }, ExtractParamsFromPathString<Rest, TParams>>
    : TPath extends `${string}:${infer Param}`
      ? { [P in ExtractParamName<Param>]: ExtractPathParamType<Param, TParams> }
      : Record<never, never>

export type PathParams<T extends string> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

export type Path<
  T extends string = any,
  P extends PathParams<T> = any
> = {
  path: T,
  params: Identity<ExtractParamsFromPathString<T, P>>,
  toString: () => string,
}

export function path<T extends string, P extends PathParams<T>>(path: T, params: Identity<P>): Path<T, P> {
  return {
    path,
    params: getParamsForString(path, params) as Path<T, P>['params'],
    toString: () => path,
  }
}

export type ToPath<T extends string | Path> = T extends string ? Path<T, {}> : T

function isPath(value: unknown): value is Path {
  return isRecord(value) && typeof value.path === 'string'
}

export function toPath<T extends string | Path>(value: T): ToPath<T>
export function toPath<T extends string | Path>(value: T): Path {
  if (isPath(value)) {
    return value
  }

  return path(value, {})
}