import { setParamValue } from '@/services/params'
import { getCaptureGroups, getParamRegexPattern, replaceIndividualParamWithCaptureGroup, replaceParamSyntaxWithCatchAlls } from '@/services/routeRegex'
import { UrlPart } from './withParams'

export function getParamValueFromUrl(url: string, path: UrlPart, paramName: string): string | undefined {
  const paramNameCaptureGroup = replaceIndividualParamWithCaptureGroup(path, paramName)
  const otherParamsCatchAll = replaceParamSyntaxWithCatchAlls(paramNameCaptureGroup)

  const [paramValue] = getCaptureGroups(url, new RegExp(otherParamsCatchAll, 'g'))

  return paramValue
}

export function setParamValueOnUrl(url: string, path: UrlPart, paramName: string, value: unknown): string {
  const paramValue = setParamValue(value, path.params[paramName])

  return url.replace(getParamRegexPattern(paramName), paramValue)
}
