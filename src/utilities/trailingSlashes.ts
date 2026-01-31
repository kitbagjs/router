import { parseUrl, stringifyUrl } from '@/services/urlParser'

/**
 * Path that starts with / and has one or more trailing slashes (excludes bare `/`). Capture group is path without trailing slashes.
 * */
const trailingSlashesRegex = /^(\/.+?)\/+$/

/**
 * Removes any trailing slashes from the path of a URL (e.g. `/foo/bar/` → `/foo/bar`). Path `/` is unchanged.
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
 */
export function pathHasTrailingSlash(url: string): boolean {
  const { path } = parseUrl(url)

  return trailingSlashesRegex.test(path)
}
