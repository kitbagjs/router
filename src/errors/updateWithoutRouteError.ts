/**
 * An error thrown when a hook calls update for a url that matched no route.
 * @group Errors
 */
export class UpdateWithoutRouteError extends Error {
  public constructor() {
    super('update called without a route to update')
  }
}
