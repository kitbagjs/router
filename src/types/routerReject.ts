import { BuiltInRejectionType } from '@/services/createRouterReject'

export type RouterReject<
  TRejectionType extends string
> = <TSource extends (TRejectionType | BuiltInRejectionType)>(type: TSource) => void
