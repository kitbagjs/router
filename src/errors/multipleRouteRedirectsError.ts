/**
 * An error thrown when duplicate parameters are detected in a route.
 * Param names must be unique. This includes params defined in a path
 * parent and params defined in the query.
 * @group Errors
 */
export class MultipleRouteRedirectsError extends Error {
  /**
   * Constructs a new MultipleRouteRedirectsError instance with a message indicating the problematic route redirect.
   * @param routeName - The name of the route that has multiple redirects.
   */
  public constructor(routeName: string) {
    super(`Invalid Route Redirect "${routeName}": Router does not support multiple redirects to the same route. All redirects must be unique.`)
  }
}
