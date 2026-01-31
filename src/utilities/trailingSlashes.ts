import { parseUrl, stringifyUrl } from '@/services/urlParser'

/**
 * Path that starts with / and has one or more trailing slashes (excludes bare `/`). Capture group is path without trailing slashes.
 * */
const trailingSlashesRegex = /^(\/.+?)\/+$/

/**
 * Removes any trailing slashes from the path of a URL (e.g. `/foo/bar/` → `/foo/bar`). Path `/` is unchanged.
 * Parses the URL into parts, trims the pathname only, then reassembles. Works for both path-only URLs and full URLs.
 */
export function removeTrailingSlashesFromPath(url: string): string {
  const { path, ...parts } = parseUrl(url)

  return stringifyUrl({
    ...parts,
    path: path.replace(trailingSlashesRegex, '$1'),
  })
}

/**
 * Returns true when the path part of the URL has trailing slashes that would be removed by removeTrailingSlashesFromUrl.
 * Returns false for path `/` (the single slash is the leading slash we preserve) and for paths that do not end with `/`.
 */
export function pathHasTrailingSlash(url: string): boolean {
  const { path } = parseUrl(url)

  return trailingSlashesRegex.test(path)
}
