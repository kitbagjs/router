type SplitURL = {
  protocol: string | undefined,
  domain: string | undefined,
  port: string | undefined,
  path: string | undefined,
  query: string | undefined,
  hash: string | undefined,
}

export function splitUrl(url: string): SplitURL {
  const urlPattern = /^(?:(?<protocol>\w+):\/\/)?(?:([^/@:]+)(?::([^/@:]+))?@)?(?<domain>[^/?#:]+)?(?:(?<port>:\d+))?(?<path>\/[^?#]*)?(?<query>\?[^#]*)?(?<hash>#.*)?$/
  const match = urlPattern.exec(url)

  return {
    protocol: match?.groups?.protocol,
    domain: match?.groups?.domain,
    port: clean(match?.groups?.port, ':'),
    path: match?.groups?.path,
    query: clean(match?.groups?.query, '?'),
    hash: clean(match?.groups?.hash, '#'),
  }
}

function clean(value: string | undefined, toRemove: string): string | undefined {
  if (!value) {
    return undefined
  }

  return value.replace(toRemove, '')
}