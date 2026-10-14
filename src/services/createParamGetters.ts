import { Param } from '@/types/param'
import { ParamGetters } from '@/types/paramGetters'
import { UrlPart } from '@/services/withParams'
import { isSameParam } from '@/services/isSameParam'

export type CreateParamGettersOptions = {
  schema: Record<string, UrlPart>,
  params: Record<string, unknown>,
}

/**
 * Looks up parsed param values by definition identity across host, path, query, and hash.
 */
export function createParamGetters(options: CreateParamGettersOptions): ParamGetters {
  const definitions = Object.values(options.schema).flatMap((part) => Object.entries(part.params))

  function getAllParams<T>(param: Param<T>): T[] {
    const params = options.params
    const values: T[] = []

    for (const [name, definition] of definitions) {
      if (!isSameParam(definition.param, param)) {
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
