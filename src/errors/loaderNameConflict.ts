/**
 * An error thrown when a loader is added with the same name as a loader on one of the route's ancestors.
 * A route's data combines the loaders of every match, so the same name twice would be ambiguous rather
 * than an override.
 * @group Errors
 */
export class LoaderNameConflict extends Error {
  public constructor(name?: string) {
    super(`Loader "${name}" conflicts with a loader of the same name on an ancestor route.`)
  }
}
