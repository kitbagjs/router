/**
 * An error thrown when router.ssr is called in the browser, where it is not available.
 * @group Errors
 */
export class RenderInBrowserError extends Error {
  public constructor() {
    super('router.ssr is only available when server rendering')
  }
}
