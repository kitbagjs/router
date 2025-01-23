/* eslint-disable @typescript-eslint/only-throw-error */
import { Param, ParamGetSet } from '@/types/paramTypes'
import { ExtractParamType } from '@/types/params'
import { getParamValue, setParamValue } from '@/services/params'

type TupleOf<T extends Param[]> = { [K in keyof T]: ExtractParamType<T[K]> }

export function tupleOf<const T extends Param[]>(...params: T): ParamGetSet<TupleOf<T>> {
  return {
    get: (value) => {
      const values = value.split(',')

      return params.map((param, index) => getParamValue(values.at(index), param)) as TupleOf<T>
    },
    set: (value, { invalid }) => {
      if (!Array.isArray(value)) {
        throw invalid('Expected a tuple')
      }

      if (value.length !== params.length) {
        throw invalid(`Expected tuple with ${params.length} values`)
      }

      return params.map((param, index) => setParamValue(value.at(index), param)).join(',')
    },
  }
}
