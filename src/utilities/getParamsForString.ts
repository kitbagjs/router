import { Param } from '@/types'
import { mergeParams } from '@/utilities/mergeParams'
import { getParam, optional } from '@/utilities/params'

export function getParamsForString<TInput extends string, TParams extends Record<string, Param | undefined>>(string: TInput, params: TParams): Record<string, unknown[]> {
  const paramPattern = /:\??([\w]+)(?=\W|$)/g
  const matches = Array.from(string.matchAll(paramPattern))

  const paramAssignments = matches.map(([match, paramName]) => {
    const isOptional = match.startsWith(':?')
    const param = getParam(params, paramName)

    return {
      [paramName]: [isOptional ? optional(param) : param],
    }
  })

  return mergeParams(...paramAssignments)
}