/**
 * An error thrown when `update` is called without a route to update. Only hooks with a destination
 * are given `update`, so this is only reachable by ignoring TypeScript.
 */
export class UpdateWithoutRouteError extends Error {
  public constructor() {
    super('update called without a route to update')
  }
}
