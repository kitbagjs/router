import { isParam, PARAM_ID_SYMBOL } from '@/types/param'
import { ParamOptions } from '@/types/paramTypes'

/**
 * Returns a param's existing identity, or creates one for a definition without an identity.
 */
export function getParamId(param: ParamOptions): symbol {
  if (isParam(param)) {
    return param[PARAM_ID_SYMBOL]
  }

  return Symbol()
}
