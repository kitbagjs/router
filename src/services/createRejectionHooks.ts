import { registerHook } from '@/services/registerHook'
import { AddRejectionHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Hooks } from '@/models/hooks'

type RejectionHooks<
  TRoutes extends Routes = Routes,
  TRejections extends string = string
> = {
  onRejection: AddRejectionHook<TRejections, TRoutes>,
  store: Hooks,
}

export function createRejectionHooks(): RejectionHooks {
  const store = new Hooks()

  const onRejection: AddRejectionHook = (hook, options) => {
    return registerHook(store.onRejection, hook, options)
  }

  return {
    onRejection,
    store,
  }
}
