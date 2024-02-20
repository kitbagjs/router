export class RouterNotInstalledError extends Error {
  public constructor() {
    super('Router not installed')
  }
}