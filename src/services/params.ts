/* eslint-disable @typescript-eslint/only-throw-error */
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { isParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isLiteralParam, isParamGetSet, isParamGetter } from '@/types/params'
import { LiteralParam, Param, ParamExtras, ParamGetSet } from '@/types/paramTypes'
import { stringHasValue } from '@/utilities/guards'
import { createZodParam, isZodParam } from './zod'

export function getParam(params: Record<string, Param | undefined>, paramName: string): Param {
  return params[paramName] ?? params[`?${paramName}`] ?? String
}

const extras: ParamExtras = {
  invalid: (message?: string) => {
    throw new InvalidRouteParamValueError(message)
  },
}

const stringParam: ParamGetSet<string> = {
  get: (value) => {
    return value
  },
  set: (value, { invalid }) => {
    if (typeof value !== 'string') {
      throw invalid()
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

    throw invalid()
  },
  set: (value, { invalid }) => {
    if (typeof value !== 'boolean') {
      throw invalid()
    }

    return value.toString()
  },
}

const numberParam: ParamGetSet<number> = {
  get: (value, { invalid }) => {
    const number = Number(value)

    if (isNaN(number)) {
      throw invalid()
    }

    return number
  },
  set: (value, { invalid }) => {
    if (typeof value !== 'number') {
      throw invalid()
    }

    return value.toString()
  },
}

const dateParam: ParamGetSet<Date> = {
  get: (value, { invalid }) => {
    const date = new Date(value)

    if (isNaN(date.getTime())) {
      throw invalid()
    }

    return date
  },
  set: (value, { invalid }) => {
    if (typeof value !== 'object' || !(value instanceof Date)) {
      throw invalid()
    }

    return value.toISOString()
  },
}

const jsonParam: ParamGetSet<unknown> = {
  get: (value, { invalid }) => {
    try {
      return JSON.parse(value)
    } catch {
      throw invalid()
    }
  },
  set: (value, { invalid }) => {
    try {
      return JSON.stringify(value)
    } catch {
      throw invalid()
    }
  },
}

function validateLiteralParamStringValue(value: string, param: LiteralParam): boolean {
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

export function getParamValue<T extends Param>(value: string | undefined, param: T, isOptional?: boolean): ExtractParamType<T>
export function getParamValue<T extends Param>(value: string | undefined, param: T, isOptional = false): unknown {
  if (value === undefined || !stringHasValue(value)) {
    if (isParamWithDefault(param)) {
      return param.defaultValue
    }

    if (isOptional) {
      return undefined
    }

    throw new InvalidRouteParamValueError()
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

    throw new InvalidRouteParamValueError()
  }

  if (isLiteralParam(param)) {
    if (validateLiteralParamStringValue(value, param)) {
      return param
    }

    throw new InvalidRouteParamValueError()
  }

  if (isZodParam(param)) {
    return createZodParam(param).get(value, extras)
  }

  return value
}

export function safeGetParamValue<T extends Param>(value: string | undefined, param: T, isOptional = false): ExtractParamType<T> | undefined {
  try {
    return getParamValue(value, param, isOptional)
  } catch (error) {
    if (error instanceof InvalidRouteParamValueError) {
      return undefined
    }
    throw error
  }
}

export function safeSetParamValue(value: unknown, param: Param, isOptional = false): string | undefined {
  try {
    return setParamValue(value, param, isOptional)
  } catch (error) {
    if (error instanceof InvalidRouteParamValueError) {
      return undefined
    }
    throw error
  }
}

export function setParamValue(value: unknown, param: Param, isOptional = false): string {
  if (value === undefined) {
    if (isOptional) {
      return ''
    }

    throw new InvalidRouteParamValueError()
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
      throw new InvalidRouteParamValueError()
    }

    return (value as LiteralParam).toString()
  }

  if (isZodParam(param)) {
    return createZodParam(param).set(value, extras)
  }

  try {
    return (value as any).toString()
  } catch {
    throw new InvalidRouteParamValueError()
  }
}
