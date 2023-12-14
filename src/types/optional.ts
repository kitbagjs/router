import { Param, ParamGetter } from '@/types/params'
import { getParamValue } from '@/utilities'

export function optional<T extends Param>(param: T): ParamGetter<T | undefined> {
  return (value: string | undefined) => {
    if (value === undefined) {
      return undefined
    }

    return getParamValue(value, param)
  }
}