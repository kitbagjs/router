import { Param } from '@/types'
import { setParamValue } from '@/utilities/params'
import { stringHasValue } from '@/utilities/string'

export function getParamValuesFromUrl(url: string, path: string, paramName: string): string[] {
  const regexPattern = getParamRegexPattern(path, paramName)

  return getCaptureGroups(url, regexPattern)
}

export type ParamReplace = {
  name: string,
  params?: Param[],
  values?: unknown,
}

export function setParamValuesOnUrl(path: string, paramReplace?: ParamReplace): string {
  if (!paramReplace) {
    return path
  }

  const { name, params = [], values = [] } = paramReplace
  const regexPattern = getParamRegexPattern(path, name)
  const captureGroups = getCaptureGroups(path, regexPattern)

  return captureGroups.reduce((value, captureGroup, index) => {
    const valueForIndex = Array.isArray(values) ? values[index] : values
    return value.replace(captureGroup, () => setParamValue(valueForIndex, params[index++]))
  }, path)
}

function getParamRegexPattern(path: string, paramName: string): RegExp {
  const optionalParamRegex = new RegExp(`(:\\?${paramName})(?=\\W|$)`, 'g')
  const requiredParamRegex = new RegExp(`(:${paramName})(?=\\W|$)`, 'g')

  return new RegExp(path.replace(optionalParamRegex, '(.*)').replace(requiredParamRegex, '(.+)'), 'g')
}

function getCaptureGroups(value: string, pattern: RegExp): string[] {
  const matches = Array.from(value.matchAll(pattern))

  return matches.flatMap(([, ...values]) => values.map(value => stringHasValue(value) ? value : ''))
}