export class DuplicateParamsError extends Error {
  public constructor(paramName: string) {
    super(`Invalid Param "${paramName}": Router does not support multiple params by the same name. All param names must be unique.`)
  }
}