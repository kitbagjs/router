/**
 * An error thrown when duplicate parameters are detected in a route.
 * Param names must be unique. This includes params defined in a path
 * parent and params defined in the query.
 */
export class DuplicateParamsError extends Error {
  /**
   * Constructs a new DuplicateParamsError instance with a message indicating the problematic parameter.
   * @param paramName - The name of the parameter that was duplicated.
   */
  public constructor(paramName: string) {
    super(`Invalid Param "${paramName}": Router does not support multiple params by the same name. All param names must be unique.`)
  }
}
