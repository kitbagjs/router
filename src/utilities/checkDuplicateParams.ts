import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { getCount } from '@/utilities/array'

export function checkDuplicateParams(...withParams: (Record<string, unknown> | string[])[]): void {
  const paramNames = withParams.flatMap((params) => {
    return Array.isArray(params) ? params : Object.keys(params)
  })

  for (const paramName of paramNames) {
    if (getCount(paramNames, paramName) > 1) {
      throw new DuplicateParamsError(paramName)
    }
  }
}
