import { Param } from '@/types/param'

export type ParamGetters = {
  /**
   * Returns the first present value using this param definition, or undefined when none is present.
   */
  getParam: <T>(param: Param<T>) => T | undefined,
  /**
   * Returns every present value using this param definition, in URL schema order.
   */
  getAllParams: <T>(param: Param<T>) => T[],
}
