/**
 * Represents an error thrown when an attempt is made to use routing functionality before the router has been installed.
 */
export class RouterNotInstalledError extends Error {
  public constructor() {
    super('Router not installed')
  }
}
