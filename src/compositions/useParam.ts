import { computed, ComputedRef, InjectionKey } from 'vue'
import { createUseRoute } from '@/compositions/useRoute'
import { Param } from '@/types/param'
import { Router } from '@/types/router'

type UseParam<T> = {
  value: ComputedRef<T | undefined>,
  values: ComputedRef<T[]>,
}

export function createUseParam<TRouter extends Router>(routerKey: InjectionKey<TRouter>): <T>(param: Param<T>) => UseParam<T> {
  const useRoute = createUseRoute(routerKey)

  return <T>(param: Param<T>): UseParam<T> => {
    const route = useRoute()

    return {
      value: computed(() => route.getParam(param)),
      values: computed(() => route.getAllParams(param)),
    }
  }
}
