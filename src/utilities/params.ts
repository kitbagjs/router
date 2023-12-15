import { Param, ParamGetSet, ParamExtras, isParamGetSet, isParamGetter, InvalidRouteParamValueError, ExtractParamType } from '@/types'

const extras: ParamExtras = {
  invalid: (message?: string) => {
    throw new InvalidRouteParamValueError(message)
  },
}

const booleanParam: ParamGetSet<unknown> = {
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

const numberParam: ParamGetSet<unknown> = {
  get: (value, { invalid }) => {
    // Number('') === 0
    if (value.length === 0) {
      throw invalid()
    }

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

export function getParamValue<T extends Param>(value: string, param: T): unknown {
  if (param === Boolean) {
    return booleanParam.get(value, extras)
  }

  if (param === Number) {
    return numberParam.get(value, extras)
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

export function setParamValue<T extends Param>(value: ExtractParamType<T>, param: T): string {
  if (param === Boolean) {
    return booleanParam.set(value, extras)
  }

  if (param === Number) {
    return numberParam.set(value, extras)
  }

  if (isParamGetter(param)) {
    const stringValue = (value as any).toString()

    param(stringValue, extras)

    return stringValue
  }

  if (isParamGetSet(param)) {
    return param.set(value, extras)
  }

  if (param instanceof RegExp) {
    if (typeof value === 'string' && param.test(value)) {
      return value
    }

    throw new InvalidRouteParamValueError()
  }

  try {
    return (value as any).toString()
  } catch (error) {
    throw new InvalidRouteParamValueError()
  }
}