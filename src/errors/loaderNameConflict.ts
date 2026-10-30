/**
 * An error thrown when a loader name is already used on the route or an ancestor.
 * @group Errors
 */
export class LoaderNameConflict extends Error {
  public constructor(name?: string) {
    super(`Loader "${name}" conflicts with a loader of the same name on this route or an ancestor route.`)
  }
}
