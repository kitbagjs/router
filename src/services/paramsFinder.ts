import { setParamValue } from '@/services/params'
import { getCaptureGroups, getParamRegexPattern, replaceParamWithCaptureGroupAndEscapeRest } from '@/services/routeRegex'
import { UrlPart } from './withParams'
import { encodeParamValue } from '@/utilities/percentEncoding'

type ParamPattern = {
  /**
   * Captures the param's value from a url, matching the rest of the part literally.
   */
  capture: RegExp,
  /**
   * Finds the param's syntax in the part, so a value can be written in its place.
   */
  placeholder: RegExp,
}

export type ParamPatterns = {
  getValue: (url: string, paramName: string) => string | undefined,
  setValue: (url: string, paramName: string, value: unknown) => string,
}

/**
 * The patterns for reading and writing each of a part's params. Built once per part, since a part's
 * params never change and every parse and stringify of a url would otherwise build them again.
 */
export function createParamPatterns(part: UrlPart): ParamPatterns {
  const patterns = new Map<string, ParamPattern>()

  for (const paramName of Object.keys(part.params)) {
    patterns.set(paramName, {
      capture: new RegExp(replaceParamWithCaptureGroupAndEscapeRest(part, paramName), 'g'),
      placeholder: getParamRegexPattern(paramName),
    })
  }

  const getValue: ParamPatterns['getValue'] = (url, paramName) => {
    const pattern = patterns.get(paramName)

    if (!pattern) {
      return undefined
    }

    const [paramValue] = getCaptureGroups(url, pattern.capture)

    return paramValue
  }

  const setValue: ParamPatterns['setValue'] = (url, paramName, value) => {
    const pattern = patterns.get(paramName)

    if (!pattern) {
      return url
    }

    const paramValue = encodeParamValue(setParamValue(value, part.params[paramName]))

    // a function keeps replacement patterns like $& in the value literal
    return url.replace(pattern.placeholder, () => paramValue)
  }

  return {
    getValue,
    setValue,
  }
}
