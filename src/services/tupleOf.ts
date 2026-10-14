import { ParamOptions, ParamGetSetOptions } from '@/types/paramTypes'
import { ExtractParamType } from '@/types/params'
import { getParamValue, setParamValue } from '@/services/params'

type TupleOfOptions = {
  separator?: string,
}

const defaultOptions = {
  separator: ',',
} satisfies TupleOfOptions

type TupleOf<T extends ParamOptions[]> = { [K in keyof T]: ExtractParamType<T[K]> }

export function tupleOf<const T extends ParamOptions[]>(params: T, options: TupleOfOptions = {}): ParamGetSetOptions<TupleOf<T>> {
  const { separator } = { ...defaultOptions, ...options }

  return {
    get: (value) => {
      const values = value.split(separator)

      return params.map((param, index) => getParamValue(values.at(index), { param })) as TupleOf<T>
    },
    set: (value, { invalid }) => {
      if (!Array.isArray(value)) {
        throw invalid('Expected a tuple')
      }

      if (value.length !== params.length) {
        throw invalid(`Expected tuple with ${params.length} values but received ${value.length} values`)
      }

      return params.map((param, index) => setParamValue(value.at(index), { param })).join(separator)
    },
  }
}
