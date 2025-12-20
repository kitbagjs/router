import { BuiltInRejectionType } from '@/services/createRouterReject'
import { Rejection, RejectionType } from '@/types/rejection'

export type RouterReject<TRejections extends Rejection[] | undefined> =
<TSource extends (RejectionType<TRejections> | BuiltInRejectionType)>(type: TSource) => void
