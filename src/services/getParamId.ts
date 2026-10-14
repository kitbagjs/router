import { isCreatedParam, PARAM_ID_SYMBOL } from '@/types/createdParam'
import { Param } from '@/types/paramTypes'

/**
 * Returns a param's existing identity, or creates one for a definition without an identity.
 */
export function getParamId(param: Param): symbol {
  if (isCreatedParam(param)) {
    return param[PARAM_ID_SYMBOL]
  }

  return Symbol()
}
