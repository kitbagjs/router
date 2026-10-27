/* eslint-disable vue/one-component-per-file */
import { defineComponent, h, InjectionKey, onErrorCaptured, onScopeDispose, PropType, provide, shallowRef, SlotsType, Suspense, VNode, watch } from 'vue'
import { createUseRouter } from '@/compositions/useRouter'
import { createUseRejection } from '@/compositions/useRejection'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'
import { isRouterRoute } from '@/services/createRouterRoute'
import { Router } from '@/types/router'
import { getRouterSuspenseInjectionKey, RouterSuspenseContext } from '@/compositions/useRouterSuspense'

export type RouterSuspenseProps = {
  /** Includes component errors when true or when the predicate returns true. */
  catch?: boolean | ((error: unknown) => boolean),
}

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
  const key = getRouterSuspenseInjectionKey(routerKey)
  const Content = defineComponent({
    name: 'RouterSuspenseContent',
    props: { context: { type: Object as PropType<RouterSuspenseContext>, required: true } },
    setup(props, { slots }) {
      provide(key, props.context)

      if (!useIsServerRendering()) {
        onErrorCaptured(props.context.captureError)
      }

      return () => {
        try {
          const children = slots.default?.()
          return children?.length === 1 ? children[0] : children
        } catch (error) {
          const handled = props.context.captureError(error, null)

          if (handled !== false) {
            throw error
          }

          return null
        }
      }
    },
  })

  return defineComponent({
    name: 'RouterSuspense',
    inheritAttrs: false,
    props: {
      catch: {
        type: [Boolean, Function] as PropType<RouterSuspenseProps['catch']>,
        default: false,
      },
    },
    slots: Object as SlotsType<RouterSuspenseSlots>,
    setup(props, { attrs, slots }) {
      const router = useRouter()
      const route = router.route
      const rejection = useRejection()
      const isServerRendering = useIsServerRendering()
      const failure = shallowRef<{ error: unknown }>()
      let active = true

      if (!isRouterRoute(routerKey, route)) {
        throw new TypeError('Expected a router route for this router')
      }

      watch([() => route.getResolvedRoute(), rejection], () => {
        failure.value = undefined
      }, { flush: 'sync' })

      onScopeDispose(() => {
        active = false
      })

      const context: RouterSuspenseContext = {
        reportError(error) {
          if (!active || isServerRendering) {
            return false
          }

          failure.value ??= { error }
          return true
        },
        captureError(error) {
          if (!active || isServerRendering || failure.value) {
            return
          }

          const shouldCatch = typeof props.catch === 'function' ? props.catch(error) : props.catch

          if (!shouldCatch) {
            return
          }

          failure.value = { error }
          return false
        },
      }

      return () => {
        if (failure.value) {
          return slots.error?.(failure.value) ?? h('p', { role: 'alert' }, 'Unable to load this content.')
        }

        return h(Suspense, attrs, {
          default: () => h(Content, { context }, slots.default),
          fallback: slots.fallback,
        })
      }
    },
  })
}
