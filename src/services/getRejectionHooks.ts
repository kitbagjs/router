import { Hooks } from '@/models/hooks'
import { getHooks } from '@/types/hooks'
import { Rejection } from '@/types/rejection'

export function getRejectionHooksFromRejection(rejection: Rejection): Hooks {
  const hooks = new Hooks()

  getHooks(rejection).forEach((store) => {
    hooks.add(...store.get('onRejection'))
  })

  return hooks
}
