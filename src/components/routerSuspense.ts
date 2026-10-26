import { defineComponent, h, InjectionKey, onErrorCaptured, shallowRef, SlotsType, Suspense, VNode, watch } from 'vue'
import { createUseRouter } from '@/compositions/useRouter'
import { createUseRejection } from '@/compositions/useRejection'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'
import { isRouterRoute } from '@/services/createRouterRoute'
import { Router } from '@/types/router'

type RouterSuspenseSlots = {
  default?: () => VNode[],
  fallback?: () => VNode[],
  error?: (props: { error: unknown }) => VNode[],
}

// Inferring the return type preserves the component's slot types.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createRouterSuspense<TRouter extends Router>(routerKey: InjectionKey<TRouter>) {
  const useRouter = createUseRouter(routerKey)
  const useRejection = createUseRejection(routerKey)

  return defineComponent({
    name: 'RouterSuspense',
    inheritAttrs: false,
    slots: Object as SlotsType<RouterSuspenseSlots>,
    setup(_props, { attrs, slots }) {
      const router = useRouter()
      const route = router.route
      const rejection = useRejection()
      const isServerRendering = useIsServerRendering()
      const failure = shallowRef<{ error: unknown }>()

      if (!isRouterRoute(routerKey, route)) {
        throw new TypeError('Expected a router route for this router')
      }

      watch([() => route.getResolvedRoute(), rejection], () => {
        failure.value = undefined
      }, { flush: 'sync' })

      if (!isServerRendering) {
        onErrorCaptured((error) => {
          if (failure.value) {
            return
          }

          failure.value = { error }
          return false
        })
      }

      return () => {
        if (failure.value) {
          return slots.error?.(failure.value) ?? h('p', { role: 'alert' }, 'Unable to load this content.')
        }

        return h(Suspense, attrs, {
          default: slots.default,
          fallback: slots.fallback,
        })
      }
    },
  })
}
