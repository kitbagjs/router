export class DuplicateParamsError extends Error {
  public constructor(paramName: string) {
    super(`Invalid Param "${paramName}": Router can not have duplicate param names in path and query.`)
  }
}