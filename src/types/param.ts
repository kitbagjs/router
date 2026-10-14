import { ParamGetSetOptions } from '@/types/paramTypes'

/**
 * A param definition that parses and stringifies values.
 */
export type Param<T = unknown> = ParamGetSetOptions<T>
