import { CollectedHooks } from '@/types/collectedHooks'
import { createCollectedHooks } from '@/services/createCollectedHooks'
import { getHooks } from '@/types/hooks'
import { Rejection } from '@/types/rejection'

export function getRejectionHooksFromRejection(rejection: Rejection): CollectedHooks {
  const hooks = createCollectedHooks()

  getHooks(rejection).forEach((store) => {
    hooks.onRejection.push(...store.onRejection)
  })

  return hooks
}
