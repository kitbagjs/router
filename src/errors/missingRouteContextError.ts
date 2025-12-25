/**
 * An error thrown when context is missing in a route. When assigning a route or rejection to a route context, that route or rejection must also be included in the options sent to `createRouter`.
 */
export class MissingRouteContextError extends Error {
  /**
   * Constructs a new MissingRouteContextError instance with a message indicating the missing context.
   * @param name - The name of the name that was duplicated.
   */
  public constructor(name: string) {
    super(`Missing Route Context: Router is missing the route "${name}", which was declared as context for at least one route.`)
  }
}
