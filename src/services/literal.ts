import { LiteralParam, ParamGetSet } from "@/types/paramTypes";

export function literal<T extends LiteralParam>(value: T): ParamGetSet<T>
export function literal(param: LiteralParam): ParamGetSet {
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
