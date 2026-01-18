/**
 * An error thrown when a route does not support redirects.
 * @group Errors
 */
export class InvalidRouteRedirectError extends Error {
  /**
   * Constructs a new InvalidRouteRedirectError instance with a message indicating the problematic route redirect.
   * @param routeName - The name of the route that does not support redirects.
   */
  public constructor(routeName: string) {
    super(`Invalid Route Redirect "${routeName}": Route does not support redirects. Use createRouteRedirects to create redirects.`)
  }
}
