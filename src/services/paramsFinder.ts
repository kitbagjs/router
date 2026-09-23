import { setParamValue } from '@/services/params'
import { getCaptureGroups, getParamRegexPattern, replaceParamWithCaptureGroupAndEscapeRest } from '@/services/routeRegex'
import { UrlPart } from './withParams'
import { encodeParamValue } from '@/utilities/percentEncoding'

export function getParamValueFromUrl(url: string, path: UrlPart, paramName: string): string | undefined {
  const pattern = replaceParamWithCaptureGroupAndEscapeRest(path, paramName)

  const [paramValue] = getCaptureGroups(url, new RegExp(pattern, 'g'))

  return paramValue
}

export function setParamValueOnUrl(url: string, path: UrlPart, paramName: string, value: unknown): string {
  const paramValue = encodeParamValue(setParamValue(value, path.params[paramName]))

  // a function keeps replacement patterns like $& in the value literal
  return url.replace(getParamRegexPattern(paramName), () => paramValue)
}
