import { getParam } from '@/services/params'
import { UrlParam, UrlParams } from '@/services/withParams'
import { isParamWithDefault } from '@/services/withDefault'
import { getParamName, isGreedyParamSyntax, isOptionalParamSyntax, paramRegex } from '@/services/routeRegex'
import { Param } from '@/types/paramTypes'
import { stringHasValue } from '@/utilities/guards'
import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'

export function getParamsForString(string: string = '', params: Record<string, Param | undefined> = {}): UrlParams {
  if (!stringHasValue(string)) {
    return {}
  }

  const matches = Array.from(string.matchAll(new RegExp(paramRegex, 'g')))

  return matches.reduce<Record<string, UrlParam>>((value, [match, key]) => {
    const paramName = getParamName(match)

    if (!paramName) {
      return value
    }

    const param = getParam(params, paramName)
    const isOptional = isOptionalParamSyntax(match) || isParamWithDefault(param)
    const isGreedy = isGreedyParamSyntax(match)

    checkDuplicateParams([paramName], value)

    value[key] = { param, isOptional, isGreedy }

    return value
  }, {})
}
