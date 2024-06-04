import { path } from '@/services/path'
import { ExtractParamName, ExtractPathParamType, MergeParams, ParamEnd, ParamStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'

type ExtractParamsFromPathString<
  TPath extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = TPath extends `${string}${ParamStart}${infer Param}${ParamEnd}${infer Rest}`
  ? MergeParams<{ [P in ExtractParamName<Param>]: ExtractPathParamType<Param, TParams> }, ExtractParamsFromPathString<Rest, TParams>>
  : Record<never, never>

export type PathParams<TPath extends string> = {
  [K in keyof ExtractParamsFromPathString<TPath>]?: Param
}

export type Path<
  TPath extends string = any,
  TParams extends PathParams<TPath> = any
> = {
  path: TPath,
  params: string extends TPath
    ? Record<string, Param>
    : Identity<ExtractParamsFromPathString<TPath, TParams>>,
  toString: () => string,
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