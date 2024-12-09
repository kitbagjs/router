/**
 * An error thrown when there is a mismatch between an expected route and the one actually used.
 * @group Errors
 */
export class UseRouteInvalidError extends Error {
  /**
   * Constructs a new UseRouteInvalidError instance with a message that specifies both the given and expected route names.
   * This detailed error message aids in quickly identifying and resolving mismatches in route usage.
   * @param routeName - The route name that was incorrectly used.
   * @param actualRouteName - The expected route name that should have been used.
   */
  public constructor(routeName: string, actualRouteName: string) {
    super(`useRoute called with incorrect route. Given ${routeName}, expected ${actualRouteName}`)
  }
}
