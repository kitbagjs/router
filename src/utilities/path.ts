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
  params: Required<P>,
}

function getParam<P extends Record<string, Param | undefined>>(params: P, param: string): Param {
  return params[param] ?? String
}

export function path<T extends string, P extends PathParams<T>>(path: T, params: Identity<P>): Path<T, P> {
  const optionalParamRegex = /:\?([\w]+)(?=\W|$)/g
  const requiredParamRegex = /:([\w]+)(?=\W|$)/g

  const value: Record<string, Param> = {}
  let match

  while ((match = optionalParamRegex.exec(path)) !== null) {
    const [, paramName] = match

    value[paramName] = optional(getParam(params, paramName))
  }

  while ((match = requiredParamRegex.exec(path)) !== null) {
    const [, paramName] = match

    value[paramName] = getParam(params, paramName)
  }

  return {
    path,
    params: value as Required<P>,
  }
}