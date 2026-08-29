/**
 * An error thrown when router.render is called in the browser. The response it reports is relative to the
 * url the router started on, so it is only meaningful while server rendering.
 * @group Errors
 */
export class RenderInBrowserError extends Error {
  public constructor() {
    super('router.render is only available when server rendering')
  }
}
