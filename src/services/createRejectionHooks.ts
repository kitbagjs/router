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

  const onRejection: AddRejectionHook = (hook) => {
    store.onRejection.add(hook)

    return () => store.onRejection.delete(hook)
  }

  return {
    onRejection,
    store,
  }
}
