import { DuplicateParamsError } from '@/errors'
import { optional } from '@/services/optional'
import { getParam } from '@/services/params'
import { paramEnd, paramStart } from '@/types/params'
import { Param } from '@/types/paramTypes'

export function getParamsForString<TInput extends string, TParams extends Record<string, Param | undefined>>(string: TInput, params: TParams): Record<string, Param> {
  const paramPattern = new RegExp(`\\${paramStart}\\??([\\w-_]+)\\${paramEnd}`, 'g')
  const matches = Array.from(string.matchAll(paramPattern))

  return matches.reduce<Record<string, Param>>((value, [match, paramName]) => {
    const isOptional = match.startsWith(`${paramStart}?`)
    const param = getParam(params, paramName)

    if (paramName in value) {
      throw new DuplicateParamsError(paramName)
    }

    value[paramName] = isOptional ? optional(param) : param

    return value
  }, {})
}