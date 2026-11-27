import { getDataKey } from '@/services/getDataKey'
import { getCallbackParent } from '@/services/getCallbackParent'
import { Computation, CreateComputationOptions, ValueLocation } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'

type TitleComputationContext = {
  to: ResolvedRoute,
  signal: AbortSignal,
  getValue: (location: ValueLocation) => Promise<unknown>,
}

export function createTitleComputation(options: CreateComputationOptions<'title'>): Computation<TitleComputationContext> {
  const { location, route, callback, routePrefetch, prefetch, transformer } = options
  const key = getDataKey({ ...location, route })
  const prefetchKey = 'title'
  const run = (context: TitleComputationContext): unknown => {
    const { to, signal } = context
    const parent = getCallbackParent(location.depth, context)
    const getParentTitle = async (): Promise<string | undefined> => parent?.getTitle()

    return callback(to, { parent, getParentTitle, signal })
  }

  return { ...location, key, prefetchKey, run, routePrefetch, prefetch, transformer }
}
