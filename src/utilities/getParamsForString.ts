import { DuplicateParamsError } from '@/errors'
import { Param } from '@/types'
import { getParam, optional } from '@/utilities/params'

export function getParamsForString<TInput extends string, TParams extends Record<string, Param | undefined>>(string: TInput, params: TParams): Record<string, Param> {
  const paramPattern = /:\??([\w]+)(?=\W|$)/g
  const matches = Array.from(string.matchAll(paramPattern))

  return matches.reduce<Record<string, Param>>((value, [match, paramName]) => {
    const isOptional = match.startsWith(':?')
    const param = getParam(params, paramName)

    if (paramName in value) {
      throw new DuplicateParamsError()
    }

    value[paramName] = isOptional ? optional(param) : param

    return value
  }, {})
}