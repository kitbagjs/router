import { inject, InjectionKey, provide } from 'vue'
import { Router } from '@/types/router'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'

const getDepthInjectionKey = createRouterKeyStore<number>()

type UseRouterDepthProps = {
  increment?: boolean,
}

type UseRouterDepthFunction = (props?: UseRouterDepthProps) => number

export function createUseRouterDepth<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UseRouterDepthFunction {
  const depthKey = getDepthInjectionKey(routerKey)

  return ({ increment = false }: UseRouterDepthProps = {}): number => {
    const depth = inject(depthKey, 0)

    if (increment) {
      provide(depthKey, depth + 1)
    }

    return depth
  }
}
