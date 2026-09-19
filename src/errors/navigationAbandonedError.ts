/**
 * Thrown when data a getter is waiting on is discarded because navigation moved elsewhere.
 * @group Errors
 */
export class NavigationAbandonedError extends Error {
  public constructor() {
    super('Discarded before it was computed because navigation moved elsewhere.')
  }
}
