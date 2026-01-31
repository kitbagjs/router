import { parseUrl, stringifyUrl } from '@/services/urlParser'

/**
 * Removes any trailing slashes from the path of a URL, preserving a single leading slash when the path would otherwise become empty (e.g. `/` → `/`).
 * Parses the URL into parts, trims the pathname only, then reassembles. Works for both path-only URLs (`/foo/bar/`) and full URLs (`https://kitbag.dev/foo/`).
 */
export function removeTrailingSlashesFromPath(url: string): string {
  const { path, ...parts } = parseUrl(url)

  const trimmed = path.replace(/\/+$/, '')

  if (trimmed === '' && path.startsWith('/')) {
    return stringifyUrl({ ...parts, path: '/' })
  }

  return stringifyUrl({ ...parts, path: trimmed })
}

/**
 * Returns true when the path part of the URL has trailing slashes that would be removed by removeTrailingSlashesFromUrl.
 * Returns false for path `/` (the single slash is the leading slash we preserve) and for paths that do not end with `/`.
 */
export function pathHasTrailingSlash(url: string): boolean {
  const { path } = parseUrl(url)

  return path.endsWith('/') && path !== '/'
}
