import { BuiltInRejectionType, Rejections, RejectionType } from '@/types/rejection'
import { ResolvedRoute } from '@/types/resolved'

export type RouterReject<TRejections extends Rejections | undefined> = <TSource extends (RejectionType<TRejections> | BuiltInRejectionType)>(type: TSource) => void

/**
 * The routes a rejection happened between, which rejection hooks are given.
 */
export type RejectContext = {
  to?: ResolvedRoute | null,
  from?: ResolvedRoute | null,
}

/**
 * Reject as the router itself calls it, which may name any rejection type and supply the routes the
 * rejection happened between. The router exposes {@link RouterReject} instead.
 */
export type RouterRejectInternal<TRejections extends Rejections | undefined> = RouterReject<TRejections> & ((type: string, context?: RejectContext) => void)
