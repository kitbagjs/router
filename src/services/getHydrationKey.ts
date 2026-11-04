import { parseUrl, stringifyUrl } from '@/services/urlParser'

/**
 * Matches data keys without the fragment or history state, which the browser does not send to the
 * server. Store entries still use the full client data key after hydration matches them.
 */
export function getHydrationKey(key: string): string | undefined {
  try {
    const parts: unknown = JSON.parse(key)

    if (!Array.isArray(parts) || parts.length !== 6) {
      return undefined
    }

    const [routeName, href, , depth, kind, name] = parts

    if (typeof href !== 'string') {
      return undefined
    }

    const { host, path, query } = parseUrl(href)
    const url = stringifyUrl({ host, path, query })

    return JSON.stringify([routeName, url, depth, kind, name])
  } catch {
    return undefined
  }
}
