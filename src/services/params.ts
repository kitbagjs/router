import { InvalidRouteParamValueError, InvalidRouteParamValueErrorContext } from '@/errors/invalidRouteParamValueError'
import { isParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isLiteralParam, isParamGetSet, isParamGetter } from '@/types/params'
import { LiteralParam, Param, ParamExtras, ParamGetSet, ParamOptions } from '@/types/paramTypes'
import { stringHasValue } from '@/utilities/guards'
import { createZodParam, isZodParam } from './zod'
import { createValibotParam, isValibotParam } from './valibot'

export function getParam(params: Record<string, Param | undefined>, paramName: string): Param {
  return params[paramName] ?? String
}

function getParamExtras(seed: InvalidRouteParamValueErrorContext): ParamExtras {
  return {
    invalid: (message?: string) => {
      throw new InvalidRouteParamValueError({ ...seed, message })
    },
  }
}

const stringParam: ParamGetSet<string> = {
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

const booleanParam: ParamGetSet<boolean> = {
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

const numberParam: ParamGetSet<number> = {
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

const dateParam: ParamGetSet<Date> = {
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

const jsonParam: ParamGetSet<unknown> = {
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

function validateLiteralParamStringValue(value: string, param: LiteralParam, extras: ParamExtras): boolean {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (typeof param) {
    case 'string':
      const stringValue = stringParam.get(value, extras)

      return stringValue === param
    case 'number':
      const numberValue = numberParam.get(value, extras)

      return numberValue === param
    case 'boolean':
      const booleanValue = booleanParam.get(value, extras)

      return booleanValue === param
    default:
      return false
  }
}

export function getParamValue<T extends Param>(value: string | undefined, [param, options]: [T, ParamOptions | undefined] | [T]): ExtractParamType<T>
export function getParamValue(value: string | undefined, [param, options]: [Param, ParamOptions | undefined] | [Param]): unknown {
  const { isOptional } = options ?? { isOptional: false }

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

  if (isParamGetter(param)) {
    return param(value, extras)
  }

  if (isParamGetSet(param)) {
    return param.get(value, extras)
  }

  if (param instanceof RegExp) {
    if (param.test(value)) {
      return value
    }

    throw extras.invalid(`Expected value to match regex ${param.toString()}, received ${JSON.stringify(value)}`)
  }

  if (isLiteralParam(param)) {
    if (validateLiteralParamStringValue(value, param, extras)) {
      return param
    }

    throw extras.invalid(`Expected value to be ${param}, received ${JSON.stringify(value)}`)
  }

  if (isZodParam(param)) {
    return createZodParam(param).get(value, extras)
  }

  if (isValibotParam(param)) {
    return createValibotParam(param).get(value, extras)
  }

  return value
}

export function safeGetParamValue<T extends Param>(value: string | undefined, [param, options]: [T, ParamOptions | undefined] | [T]): ExtractParamType<T> | undefined {
  try {
    return getParamValue(value, [param, options])
  } catch (error) {
    if (error instanceof InvalidRouteParamValueError) {
      return undefined
    }
    throw error
  }
}

export function safeSetParamValue(value: unknown, [param, options]: [Param, ParamOptions | undefined] | [Param]): string | undefined {
  try {
    return setParamValue(value, [param, options])
  } catch (error) {
    if (error instanceof InvalidRouteParamValueError) {
      return undefined
    }
    throw error
  }
}

export function setParamValue(value: unknown, [param, options]: [Param, ParamOptions | undefined] | [Param]): string {
  const { isOptional } = options ?? { isOptional: false }

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

  if (isParamGetSet(param)) {
    return param.set(value, extras)
  }

  if (isLiteralParam(param)) {
    if (param !== value) {
      throw extras.invalid(`Expected value to be literal ${param}, received ${JSON.stringify(value)}`)
    }

    return (value as LiteralParam).toString()
  }

  if (isZodParam(param)) {
    return createZodParam(param).set(value, extras)
  }

  if (isValibotParam(param)) {
    return createValibotParam(param).set(value, extras)
  }

  try {
    return (value as any).toString()
  } catch {
    throw extras.invalid(`Unable to set param value, received ${JSON.stringify(value)}`)
  }
}
