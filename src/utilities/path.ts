import { optional, Param, Identity, Path, PathParamsParameter, PathParamsParameterToPathParams } from '@/types'
import { mergeParams } from '@/utilities'

function getParam<P extends Record<string, Param | undefined>>(params: P, param: string): Param {
  return params[param] ?? String
}

export function path<T extends string, P extends PathParamsParameter<T>>(path: T, params: Identity<P>): Path<T, PathParamsParameterToPathParams<T, P>> {
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
    params: mergeParams(...paramAssignments) as PathParamsParameterToPathParams<T, P>,
  }
}