import { LiteralParam, ParamGetSetOptions } from '@/types/paramTypes'

export function literal<T extends LiteralParam>(value: T): ParamGetSetOptions<T>
export function literal(param: LiteralParam): ParamGetSetOptions {
  return {
    get: (value, { invalid }) => {
      if (`${param}` === value) {
        return param
      }

      throw invalid(`Expected value to be ${param}, received ${JSON.stringify(value)}`)
    },
    set: (value, { invalid }) => {
      if (param !== value) {
        throw invalid(`Expected value to be literal ${param}, received ${JSON.stringify(value)}`)
      }

      return (value as LiteralParam).toString()
    },
  }
}
