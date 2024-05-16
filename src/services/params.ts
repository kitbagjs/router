import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { ExtractParamType, isParamGetSet, isParamGetter } from '@/types/params'
import { Param, ParamExtras, ParamGetSet } from '@/types/paramTypes'
import { stringHasValue } from '@/utilities/string'

export function getParam<P extends Record<string, Param | undefined>>(params: P, param: string): Param {
  return params[param] ?? String
}

const optionalKey = Symbol()

type OptionalParamGetSet<TParam extends Param, TValue = ExtractParamType<TParam> | undefined> = ParamGetSet<TValue> & {
  [optionalKey]: true,
  get: (value: string | undefined, extras: ParamExtras) => TValue,
}

export function isOptionalParam(param: Param | OptionalParamGetSet<Param>): param is OptionalParamGetSet<Param> {
  return optionalKey in param
}

export function optional<TParam extends Param>(param: TParam): OptionalParamGetSet<TParam> {
  return {
    [optionalKey]: true,
    get: (value) => {
      if (!stringHasValue(value)) {
        return undefined
      }

      return getParamValue(value, param)
    },
    set: (value) => {
      if (!stringHasValue(value)) {
        return ''
      }

      return setParamValue(value, param)
    },
  }
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
    console.log('inside date getter')
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

export function getParamValue<T extends Param>(value: string | undefined, param: T): ExtractParamType<T>
export function getParamValue<T extends Param>(value: string | undefined, param: T): unknown {
  if (value === undefined) {
    if (isOptionalParam(param)) {
      return param.get(value, extras)
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

export function setParamValue(value: unknown, param: Param): string {
  if (param === Boolean) {
    return booleanParam.set(value as boolean, extras)
  }

  if (param === Number) {
    return numberParam.set(value as number, extras)
  }

  if (isParamGetSet(param)) {
    return param.set(value, extras)
  }

  try {
    return (value as any).toString()
  } catch (error) {
    throw new InvalidRouteParamValueError()
  }
}