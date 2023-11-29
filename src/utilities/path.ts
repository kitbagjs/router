import { Param } from '../types/params'
import { ExtractParamsFromPathString } from '../types/routeMethods'
import { Identity } from '../types/utilities'

type PathParams<T extends string> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

export type Path<
  T extends string = any,
  P extends PathParams<T> = any
> = {
  path: T,
  params: P
}

export function path<T extends string, P extends PathParams<T>>(_path: T, _params: Identity<P>): Path<T, P> {
  throw 'not implemented'
}