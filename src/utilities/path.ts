import { optional } from '@/types'
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
  toString: () => string,
}

export function path<T extends string, P extends PathParams<T>>(path: T, params: Identity<P>): Path<T, P> {
  const optionalParamRegex = /:\?([\w]+)(?=\W|$)/g
  const requiredParamRegex = /:([\w]+)(?=\W|$)/g
  const value: Record<string, any> = params
  let match

  while ((match = optionalParamRegex.exec(path)) !== null) {
    const [, paramName] = match

    if (!(paramName in params)) {
      value[paramName] = optional(String)
    }
  }

  while ((match = requiredParamRegex.exec(path)) !== null) {
    const [, paramName] = match


    if (!(paramName in params)) {
      value[paramName] = String
    }
  }

  return {
    path,
    params,
    toString: () => path,
  }
}