import { Param } from '@/types/paramTypes'

export type InvalidRouteParamValueErrorContext = {
  message?: string,
  param?: Param,
  value?: unknown,
  isOptional?: boolean,
  isGetter?: boolean,
  isSetter?: boolean,
}

export class InvalidRouteParamValueError extends Error {
  public context: InvalidRouteParamValueErrorContext

  public constructor(context: InvalidRouteParamValueErrorContext = {}) {
    super(context.message ?? 'Uncaught InvalidRouteParamValueError')

    this.context = {
      isOptional: false,
      isGetter: false,
      isSetter: false,
      ...context,
    }
  }
}
