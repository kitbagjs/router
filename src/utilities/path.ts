import { optional, Param, ExtractParamsFromPathString, Identity } from '@/types'
import { combineParams, getCaptureGroup } from '@/utilities'

type PathParams<T extends string> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

export type Path<
  T extends string = any,
  P extends PathParams<T> = any
> = {
  path: T,
  params: P,
}

export function path<T extends string, P extends PathParams<T>>(path: T, params: Identity<P>): Path<T, P> {
  const optionalParamNames = getCaptureGroup(path, /:\?([\w]+)(?=\W|$)/g)
  const requiredParamNames = getCaptureGroup(path, /:([\w]+)(?=\W|$)/g)

  const optionalParams = optionalParamNames.reduce<Record<string, any>>((reduced, paramName) => {
    if (!(paramName in params)) {
      const param = getParam(params, paramName)
      reduced[paramName] = param ? optional(param) : optional(String)
    }

    return params
  }, {})

  const requiredParams = requiredParamNames.reduce<Record<string, any>>((reduced, paramName) => {
    if (!(paramName in params)) {
      const param = getParam(params, paramName)
      reduced[paramName] = param ?? String
    }

    return params
  }, {})

  return {
    path,
    params: combineParams(optionalParams, requiredParams),
  }
}

function getParam<T extends string, P extends PathParams<T>>(params: P, key: string): Param | undefined {
  if (key in params) {
    return params[key as keyof P]
  }

  return undefined
}