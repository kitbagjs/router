import { createParam } from '@/services/createParam'
import { Param } from '@/types/param'
import { LiteralParam } from '@/types/paramTypes'

export function literal<T extends LiteralParam>(value: T): Param<T>
export function literal(param: LiteralParam): Param {
  return createParam<Param>({
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
  })
}
