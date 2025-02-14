import { getParam } from '@/services/params'
import { getParamName, paramRegex } from '@/services/routeRegex'
import { Param } from '@/types/paramTypes'
import { stringHasValue } from '@/utilities/guards'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export function getParamsForString(string: string = '', params: Record<string, Param | undefined> = {}): Record<string, Param> {
  if (!stringHasValue(string)) {
    return {}
  }

  const matches = Array.from(string.matchAll(new RegExp(paramRegex, 'g')))

  return matches.reduce<Record<string, Param>>((value, [match, key]) => {
    const paramName = getParamName(match)

    if (!paramName) {
      return value
    }

    const param = getParam(params, paramName)

    checkDuplicateParams([paramName], value)

    value[key] = param

    return value
  }, {})
}
