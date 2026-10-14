import { isParam, Param, ParamInternal, PARAM_ID_SYMBOL } from '@/types/param'
import { ParamOptions } from '@/types/paramTypes'

/**
 * Determines whether two param definitions share the same identity.
 */
export function isSameParam(left: ParamOptions, right: ParamOptions): left is Param & ParamInternal {
  if (!isParam(left) || !isParam(right)) {
    return false
  }

  return left[PARAM_ID_SYMBOL] === right[PARAM_ID_SYMBOL]
}
