import { parseUrl, stringifyUrl } from '@/services/urlParser'
import { parseDataKey } from '@/services/parseDataKey'

/**
 * Matches data keys without the fragment or history state, which the browser does not send to the
 * server. Store entries still use the full client data key after hydration matches them.
 */
export function getHydrationKey(key: string): string {
  const [routeName, href, , depth, kind, name] = parseDataKey(key)
  const { host, path, query } = parseUrl(href)
  const url = stringifyUrl({ host, path, query })

  return JSON.stringify([routeName, url, depth, kind, name])
}
