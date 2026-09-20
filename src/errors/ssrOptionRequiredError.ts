/**
 * An error thrown when `render` is called on a router that was not created with the `ssr` option.
 * @group Errors
 */
export class SsrOptionRequiredError extends Error {
  public constructor() {
    super('Calling render requires the router to be created for server rendering: createRouter(routes, { ssr: true })')
  }
}
