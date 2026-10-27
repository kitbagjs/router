import { CollectedHooks } from '@/models/collectedHooks'
import { getHooks } from '@/types/hooks'
import { Rejection } from '@/types/rejection'

export function getRejectionHooksFromRejection(rejection: Rejection): CollectedHooks {
  const hooks = new CollectedHooks()

  getHooks(rejection).forEach((store) => {
    hooks.onRejection.push(...store.onRejection)
  })

  return hooks
}
