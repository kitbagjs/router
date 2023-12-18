export function findParamValues(url: string, path: string, paramName: string): string[] {
  const optionalParamRegex = new RegExp(`(:\\?${paramName})(?=\\W|$)`, 'g')
  const requiredParamRegex = new RegExp(`(:${paramName})(?=\\W|$)`, 'g')
  const regexPattern = new RegExp(path.replace(optionalParamRegex, '(.*)').replace(requiredParamRegex, '(.+)'), 'g')

  const matches = Array.from(url.matchAll(regexPattern))

  return matches.flatMap(([, ...values]) => values)
}