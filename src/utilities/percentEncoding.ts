/**
 * Encodes the characters in a param value that would otherwise be read as syntax: a percent sign starts
 * an escape, and square brackets mark a param. Everything else is left for the url to encode.
 */
export function encodeParamValue(value: string): string {
  return value.replace(/[%[\]]/g, encodeURIComponent)
}

/**
 * Decodes a param value taken from a url. A malformed escape is kept as written rather than thrown on,
 * and a missing value stays missing.
 */
export function decodeParamValue(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
