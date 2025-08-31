export class RouterPreloadErrorAbort extends Error {
  public constructor() {
    super('Router preload error aborted')
  }
}
