import { Param } from '@/types/param'
import { ParamOptions } from '@/types/paramTypes'
import { ExtractParamType } from '@/types/params'
import { getParamValue, setParamValue } from '@/services/params'

type TupleOfOptions = {
  separator?: string,
}

const defaultOptions = {
  separator: ',',
} satisfies TupleOfOptions

type TupleOf<TParamOptions extends ParamOptions[]> = { [K in keyof TParamOptions]: ExtractParamType<TParamOptions[K]> }

export function tupleOf<const TParamOptions extends ParamOptions[]>(params: TParamOptions, options: TupleOfOptions = {}): Param<TupleOf<TParamOptions>> {
  const { separator } = { ...defaultOptions, ...options }

  return {
    get: (value) => {
      const values = value.split(separator)

      return params.map((param, index) => getParamValue(values.at(index), { param })) as TupleOf<TParamOptions>
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
