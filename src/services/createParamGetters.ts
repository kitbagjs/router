import { Param, isParam, PARAM_ID_SYMBOL } from '@/types/param'
import { ParamGetters } from '@/types/paramGetters'
import { UrlInternal } from '@/types/url'

/**
 * Looks up parsed param values by definition identity across host, path, query, and hash.
 */
export function createParamGetters(schema: UrlInternal['schema'], getParams: () => Record<string, unknown>): ParamGetters {
  const definitions = Object.values(schema).flatMap((part) => Object.entries(part.params))

  function getAllParams<T>(param: Param<T>): T[] {
    const params = getParams()
    const values: T[] = []

    for (const [name, definition] of definitions) {
      if (!isParam(definition.param) || definition.param[PARAM_ID_SYMBOL] !== param[PARAM_ID_SYMBOL]) {
        continue
      }

      let value = params[name]

      if (value === undefined) {
        value = definition.param.defaultValue
      }

      if (value !== undefined) {
        values.push(value as T)
      }
    }

    return values
  }

  return {
    getParam: (param) => getAllParams(param)[0],
    getAllParams,
  }
}
