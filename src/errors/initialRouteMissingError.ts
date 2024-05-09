export class InitialRouteMissingError extends Error {
  public constructor() {
    super('initialUrl must be set if window.location is unavailable')
  }
}