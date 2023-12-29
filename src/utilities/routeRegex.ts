export function generateRouteRegexPattern(value: string): RegExp {
  const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g
  const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

  const routeRegex = value.replace(optionalParamRegex, '(.*)').replace(requiredParamRegex, '(.+)')
  return new RegExp(`^${routeRegex}$`)
}