import { Param } from '@/types/params'
import { ExtractParamsFromPathString } from '@/types/routeMethods'
import { Identity } from '@/types/utilities'

type PathParams<T extends string> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

export type Path<
  T extends string = any,
  P extends PathParams<T> = any
> = {
  path: T,
  params: P,
}

export function path<T extends string, P extends PathParams<T>>(_path: T, _params: Identity<P>): Path<T, P> {
  throw 'not implemented'
}

export function combineRoute(...parts: string[]): string {
  return parts.map(removeLeadingAndTrailingSlashes).join('/')
}

export function removeLeadingAndTrailingSlashes(value: string): string {
  const regex = /^\/*(.*?)\/*$/g

  const [, inside] = regex.exec(value) ?? []
  return inside
}