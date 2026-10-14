import { CreatedParam } from '@/types/createdParam'

export type ParamGetters = {
  /**
   * Returns the first present value using this param definition, or undefined when none is present.
   */
  getParam: <T>(param: CreatedParam<T>) => T | undefined,
  /**
   * Returns every present value using this param definition, in URL schema order.
   */
  getAllParams: <T>(param: CreatedParam<T>) => T[],
}
