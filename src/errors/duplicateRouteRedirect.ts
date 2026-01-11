/**
 * An error thrown when duplicate parameters are detected in a route.
 * Param names must be unique. This includes params defined in a path
 * parent and params defined in the query.
 * @group Errors
 */
export class DuplicateRouteRedirectError extends Error {
  /**
   * Constructs a new DuplicateRouteRedirectError instance with a message indicating the problematic route redirect.
   * @param routeRedirect - The route redirect that was duplicated.
   */
  public constructor(routeRedirect: RouteRedirect) {
    super('Duplicate Route Redirect')
  }
}
