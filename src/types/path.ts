import { path as createPath } from '@/services/path'
import { ExtractParamName, ExtractPathParamType, ParamEnd, ParamStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'

type ExtractParamsFromPathString<
  TPath extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = TPath extends `${string}${ParamStart}${infer Param}${ParamEnd}${infer Rest}`
  ? Record<Param, ExtractPathParamType<Param, TParams>> & ExtractParamsFromPathString<Rest, TParams>
  : Record<never, never>

export type PathParams<TPath extends string> = {
  [K in keyof ExtractParamsFromPathString<TPath>]?: Param
}

export type PathParamsWithParamNameExtracted<TPath extends string> = {
  [K in keyof ExtractParamsFromPathString<TPath> as ExtractParamName<K>]?: Param
}

export type Path<
  TPath extends string = string,
  TParams extends PathParamsWithParamNameExtracted<TPath> = Record<string, Param | undefined>
> = {
  value: TPath,
  params: string extends TPath ? Record<string, Param> : Identity<ExtractParamsFromPathString<TPath, TParams>>,
  toString: () => string,
}
export type ToPath<T extends string | Path | undefined> = T extends string
  ? Path<T, {}>
  : T extends undefined
    ? Path<'', {}>
    : unknown extends T
      ? Path<'', {}>
      : T

function isPath(maybePath: unknown): maybePath is Path {
  return isRecord(maybePath) && typeof maybePath.value === 'string'
}

export function toPath<T extends string | Path | undefined>(path: T): ToPath<T>
export function toPath<T extends string | Path | undefined>(path: T): Path {
  if (path === undefined) {
    return createPath('', {})
  }

  if (isPath(path)) {
    return path
  }

  return createPath(path, {})
}
