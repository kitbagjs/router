import { optional, Param, ExtractParamsFromPathString, Identity, Path } from '@/types'
import { combineParams } from '@/utilities'

type PathParamsParameter<T extends string> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

function getParam<P extends Record<string, Param | undefined>>(params: P, param: string): Param {
  return params[param] ?? String
}

export function path<T extends string, P extends PathParamsParameter<T>>(path: T, params: Identity<P>): Path<T> {
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