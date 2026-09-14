/**
 * An error thrown when router.render is called in the browser, where it is not available.
 * @group Errors
 */
export class RenderInBrowserError extends Error {
  public constructor() {
    super('router.render is only available when server rendering')
  }
}
