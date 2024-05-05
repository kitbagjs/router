/**
 * Represents an error thrown when a route hook wishes to redirect the user to a different route.
 */
export class RouterPushError extends Error {
  public to: unknown[]

  public constructor(to: unknown[]) {
    super('Error occurred during a router push operation.')

    this.to = to
  }
}
