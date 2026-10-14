import { Param } from '@/types/param'

export type GetParam = <T>(param: Param<T>) => T | undefined
export type GetAllParams = <T>(param: Param<T>) => T[]

export type ParamGetters = {
  /**
   * Returns the first present value using this param definition, or undefined when none is present.
   */
  getParam: GetParam,
  /**
   * Returns every present value using this param definition, in URL schema order.
   */
  getAllParams: GetAllParams,
}
