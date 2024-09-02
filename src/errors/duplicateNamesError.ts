/**
 * An error thrown when duplicate names are detected in a route.
 * Names must be unique.
 */
export class DuplicateNamesError extends Error {
  /**
   * Constructs a new DuplicateNamesError instance with a message indicating the problematic name.
   * @param name - The name of the name that was duplicated.
   */
  public constructor(name: string) {
    super(`Invalid Name "${name}": Router does not support multiple routes with the same name. All name names must be unique.`)
  }
}
