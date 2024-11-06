import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { isParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isParamGetSet, isParamGetter } from '@/types/params'
import { Param, ParamExtras, ParamGetSet } from '@/types/paramTypes'
import { stringHasValue } from '@/utilities/guards'

export function getParam(params: Record<string, Param | undefined>, paramName: string): Param {
  return params[paramName] ?? String
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

  return value
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

  try {
    return (value as any).toString()
  } catch {
    throw new InvalidRouteParamValueError()
  }
}
