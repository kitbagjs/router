export function getRegexMatcher(regex: RegExp): RegExp {
  if (!regex.global && !regex.sticky) {
    return regex
  }

  return new RegExp(regex.source, regex.flags)
}
