import { Hooks } from '@/models/hooks'
import { getHooks } from '@/types/hooks'
import { Rejection } from '@/types/rejection'

export function getRejectionHooksFromRejection(rejection: Rejection): Hooks {
  const hooks = new Hooks()

  getHooks(rejection).forEach((store) => {
    store.onRejection.forEach((hook) => hooks.onRejection.add(hook))
  })

  return hooks
}
