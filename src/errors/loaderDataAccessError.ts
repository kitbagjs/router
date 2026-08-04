/**
 * An error thrown when a loader reads the data of the route it belongs to. That data includes what the
 * loader itself is computing, so reading it could only wait on the loader that is doing the reading.
 * @group Errors
 */
export class LoaderDataAccessError extends Error {
  public constructor(name?: string) {
    super(`Loader "${name}" read the data of the route it belongs to, which cannot resolve while the loader is still running. Read a parent's data with context.parent.data, or move the shared work into a function both loaders call.`)
  }
}
