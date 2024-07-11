import { getParam } from '@/services/params'
import { getParamName } from '@/services/routeRegex'
import { paramEnd, paramStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

export function getParamsForString<TInput extends string, TParams extends Record<string, Param | undefined>>(string: TInput, params: TParams): Record<string, Param> {
  const paramPattern = new RegExp(`\\${paramStart}(\\??[\\w-_]+)\\${paramEnd}`, 'g')
  const matches = Array.from(string.matchAll(paramPattern))

  return matches.reduce<Record<string, Param>>((value, [match, key]) => {
    const paramName = getParamName(match)

    if (!paramName) {
      return value
    }

    const param = getParam(params, paramName)

    checkDuplicateKeys([paramName], value)

    value[key] = param

    return value
  }, {})
}