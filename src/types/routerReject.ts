import { BuiltInRejectionType } from '@/services/createRouterReject'
import { AsString } from './utilities'

export type RouterReject<
  TRejectionType extends PropertyKey
> = (type: AsString<TRejectionType> | BuiltInRejectionType) => void
