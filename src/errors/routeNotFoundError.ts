/**
 * An error thrown when attempting to resolve a route that does not exist
 */
export class RouteNotFoundError extends Error {
  public constructor(source: string) {
    super(`Route not found: "${source}"`)
  }
}
