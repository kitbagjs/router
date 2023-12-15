import { optional, Param, ExtractParamsFromPathString, Identity } from '@/types'
import { combineParams } from '@/utilities'

type PathParams<T extends string> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

export type Path<
  T extends string = any,
  P extends Record<string, Param[]> = any
> = {
  path: T,
  params: Required<P>,
}

function getParam<P extends Record<string, Param | undefined>>(params: P, param: string): Param {
  return params[param] ?? String
}

export function path<T extends string, P extends PathParams<T>>(path: T, params: Identity<P>): Path<T> {
  const paramPattern = /:\??([\w]+)(?=\W|$)/g
  const matches = Array.from(path.matchAll(paramPattern))

  const paramAssignments = matches.map(([match, paramName]) => {
    const isOptional = match.startsWith(':?')
    const param = getParam(params, paramName)

    return {
      [paramName]: [isOptional ? optional(param) : param],
    }
  })

  return {
    path,
    params: combineParams(...paramAssignments),
  }
}