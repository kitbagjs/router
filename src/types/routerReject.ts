import { BuiltInRejectionType } from '@/services/createRouterReject'
import { Rejections, RejectionType } from '@/types/rejection'

export type RouterReject<TRejections extends Rejections | undefined> =
<TSource extends (RejectionType<TRejections> | BuiltInRejectionType)>(type: TSource) => void
