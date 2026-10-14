import { InvalidRouteParamValueError, InvalidRouteParamValueErrorContext } from '@/errors/invalidRouteParamValueError'
import { isParamWithDefault } from '@/services/withDefault'
import { UrlParam } from '@/services/withParams'
import { ExtractParamType, isLiteralParam, isParamGetSetOptions, isParamGetter } from '@/types/params'
import { LiteralParam, ParamOptions, ParamExtras, ParamGetSetOptions } from '@/types/paramTypes'
import { getRegexMatcher } from '@/utilities/getRegexMatcher'
import { stringHasValue } from '@/utilities/guards'
import { createStandardSchemaParam, isStandardSchema } from './standardSchema'
import { literal } from './literal'

export function getParam(params: Record<string, ParamOptions | undefined>, paramName: string): ParamOptions {
  return params[paramName] ?? String
}

function getParamExtras(seed: InvalidRouteParamValueErrorContext): ParamExtras {
  return {
    invalid: (message?: string) => {
      throw new InvalidRouteParamValueError({ ...seed, message })
    },
  }
}

const stringParam: ParamGetSetOptions<string> = {
  get: (value) => {
    return value
  },
  set: (value, { invalid }) => {
    if (typeof value !== 'string') {
      throw invalid(`Expected string value, received ${JSON.stringify(value)}`)
    }

    return value
  },
}

const booleanParam: ParamGetSetOptions<boolean> = {
  get: (value, { invalid }) => {
    if (value === 'true') {
      return true
    }

    if (value === 'false') {
      return false
    }

    throw invalid(`Expected boolean value, received ${JSON.stringify(value)}`)
  },
  set: (value, { invalid }) => {
    if (typeof value !== 'boolean') {
      throw invalid(`Expected boolean value, received ${JSON.stringify(value)}`)
    }

    return value.toString()
  },
}

const numberParam: ParamGetSetOptions<number> = {
  get: (value, { invalid }) => {
    const number = Number(value)

    if (isNaN(number)) {
      throw invalid(`Expected number value, received ${JSON.stringify(value)}`)
    }

    return number
  },
  set: (value, { invalid }) => {
    if (typeof value !== 'number') {
      throw invalid(`Expected number value, received ${JSON.stringify(value)}`)
    }

    return value.toString()
  },
}

const dateParam: ParamGetSetOptions<Date> = {
  get: (value, { invalid }) => {
    const date = new Date(value)

    if (isNaN(date.getTime())) {
      throw invalid(`Expected date value, received ${JSON.stringify(value)}`)
    }

    return date
  },
  set: (value, { invalid }) => {
    if (typeof value !== 'object' || !(value instanceof Date)) {
      throw invalid(`Expected date value, received ${JSON.stringify(value)}`)
    }

    return value.toISOString()
  },
}

const jsonParam: ParamGetSetOptions<unknown> = {
  get: (value, { invalid }) => {
    try {
      return JSON.parse(value)
    } catch {
      throw invalid(`Expected JSON value, received "${value}"`)
    }
  },
  set: (value, { invalid }) => {
    try {
      return JSON.stringify(value)
    } catch {
      throw invalid(`Expected JSON value, received "${value}"`)
    }
  },
}

export function getParamValue<TParamOptions extends ParamOptions>(value: string | undefined, param: Partial<UrlParam<TParamOptions>>): ExtractParamType<TParamOptions>
export function getParamValue(value: string | undefined, { param = String, isOptional = false }: Partial<UrlParam> = {}): unknown {
  const extras = getParamExtras({ param, value, isGetter: true })
  if (value === undefined || !stringHasValue(value)) {
    if (isParamWithDefault(param)) {
      return param.defaultValue
    }

    if (isOptional) {
      return undefined
    }

    throw extras.invalid(`Param is not optional, received ${JSON.stringify(value)}`)
  }

  if (param === String) {
    return stringParam.get(value, extras)
  }

  if (param === Boolean) {
    return booleanParam.get(value, extras)
  }

  if (param === Number) {
    return numberParam.get(value, extras)
  }

  if (param === Date) {
    return dateParam.get(value, extras)
  }

  if (param === JSON) {
    return jsonParam.get(value, extras)
  }

  if (isStandardSchema(param)) {
    return createStandardSchemaParam(param).get(value, extras)
  }

  if (isParamGetter(param)) {
    return param(value, extras)
  }

  if (isParamGetSetOptions(param)) {
    return param.get(value, extras)
  }

  if (param instanceof RegExp) {
    const matcher = getRegexMatcher(param)

    if (matcher.test(value)) {
      return value
    }

    throw extras.invalid(`Expected value to match regex ${param.toString()}, received ${JSON.stringify(value)}`)
  }

  if (isLiteralParam(param)) {
    return literal(param).get(value, extras)
  }

  return value
}

export function safeGetParamValue<TParamOptions extends ParamOptions>(value: string | undefined, param: Partial<UrlParam<TParamOptions>>): ExtractParamType<TParamOptions> | undefined {
  try {
    return getParamValue(value, param)
  } catch (error) {
    if (error instanceof InvalidRouteParamValueError) {
      return undefined
    }
    throw error
  }
}

export function safeSetParamValue(value: unknown, param: Partial<UrlParam>): string | undefined {
  try {
    return setParamValue(value, param)
  } catch (error) {
    if (error instanceof InvalidRouteParamValueError) {
      return undefined
    }
    throw error
  }
}

export function setParamValue(value: unknown, { param = String, isOptional = false }: Partial<UrlParam> = {}): string {
  const extras = getParamExtras({ param, value, isSetter: true })
  if (value === undefined) {
    if (isOptional) {
      return ''
    }

    throw extras.invalid(`Param is not optional, received ${JSON.stringify(value)}`)
  }

  if (param === Boolean) {
    return booleanParam.set(value as boolean, extras)
  }

  if (param === Number) {
    return numberParam.set(value as number, extras)
  }

  if (param === Date) {
    return dateParam.set(value as Date, extras)
  }

  if (param === JSON) {
    return jsonParam.set(value, extras)
  }

  if (isStandardSchema(param)) {
    return createStandardSchemaParam(param).set(value, extras)
  }

  if (isParamGetSetOptions(param)) {
    return param.set(value, extras)
  }

  if (isLiteralParam(param)) {
    return literal(param).set(value as LiteralParam, extras)
  }

  try {
    return (value as any).toString()
  } catch {
    throw extras.invalid(`Unable to set param value, received ${JSON.stringify(value)}`)
  }
}
