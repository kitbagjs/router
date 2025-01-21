/* eslint-disable @typescript-eslint/only-throw-error */
import { ParamGetSet } from '@/types/paramTypes'

export function oneOf<const T extends unknown[]>(possibleValues: T): ParamGetSet<T[number]> {
  return {
    get: (value, { invalid }) => {
      if (!possibleValues.includes(value)) {
        throw invalid(`Value ${value} is not in the list of possible values: ${possibleValues.join(', ')}`)
      }

      return value
    },
    set: (value, { invalid }) => {
      if (!possibleValues.includes(value)) {
        throw invalid(`Value ${value} is not in the list of possible values: ${possibleValues.join(', ')}`)
      }

      return (value as any).toString()
    },
  }
}
