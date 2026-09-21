/**
 * An error thrown when a named route's path does not start with `/`.
 * Url pathnames always start with `/`, so such a route can never match a url.
 */
export class UnreachableRouteError extends Error {
  public constructor(name: string, path: string) {
    super(`Invalid Path "${path}" for route "${name}": Url pathnames always start with "/", so this route can never match a url. Make sure the combined path of the route and its parents starts with "/".`)
  }
}
