import { BuiltInRejectionType } from '@/services/createRouterReject'
import { AsString } from './utilities'

export type RouterReject<
  TRejectionType extends string
> = (type: AsString<TRejectionType> | BuiltInRejectionType) => void
