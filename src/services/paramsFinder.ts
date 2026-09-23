import { setParamValue } from '@/services/params'
import { getCaptureGroups, getParamRegexPattern, replaceParamWithCaptureGroupAndEscapeRest } from '@/services/routeRegex'
import { UrlPart } from './withParams'

export function getParamValueFromUrl(url: string, path: UrlPart, paramName: string): string | undefined {
  const pattern = replaceParamWithCaptureGroupAndEscapeRest(path, paramName)

  const [paramValue] = getCaptureGroups(url, new RegExp(pattern, 'g'))

  return paramValue
}

export function setParamValueOnUrl(url: string, path: UrlPart, paramName: string, value: unknown): string {
  const paramValue = setParamValue(value, path.params[paramName])

  return url.replace(getParamRegexPattern(paramName), paramValue)
}
