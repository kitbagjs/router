import { optional, Param, Identity, Path, PathParamsParameter, PathParams, OptionalParam } from '@/types'
import { mergeParams } from '@/utilities'

function getParam<P extends Record<string, OptionalParam>>(params: P, param: string): Param {
  return params[param] ?? String
}

export function path<T extends string, P extends PathParamsParameter<T>>(path: T, params: Identity<P>): Path<T, PathParams<T, P>> {
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
    params: mergeParams(...paramAssignments) as PathParams<T, P>,
  }
}