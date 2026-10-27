import { HooksCollection } from '@/types/hooksCollection'
import { createHooksCollection } from '@/services/createHooksCollection'
import { getHooks } from '@/types/hooks'
import { Rejection } from '@/types/rejection'

export function getRejectionHooksFromRejection(rejection: Rejection): HooksCollection {
  const hooks = createHooksCollection()

  getHooks(rejection).forEach((store) => {
    hooks.onRejection.push(...store.onRejection)
  })

  return hooks
}
