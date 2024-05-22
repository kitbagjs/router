/**
 * An error thrown when attempting to resolve a route that is disabled
 */
export class RouteDisabledError extends Error {
  public constructor(source: string) {
    super(`Route disabled: "${source}"`)
  }
}