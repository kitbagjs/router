/* eslint-disable vue/one-component-per-file */
import { defineComponent, h, InjectionKey, onErrorCaptured, onScopeDispose, PropType, provide, renderSlot, shallowRef, SlotsType, Suspense, VNode, watch } from 'vue'
import { createUseRouter } from '@/compositions/useRouter'
import { createUseRejection } from '@/compositions/useRejection'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'
import { isRouterRoute } from '@/services/createRouterRoute'
import { Router } from '@/types/router'
import { getRouterSuspenseInjectionKey, RouterSuspenseContext } from '@/compositions/useRouterSuspense'

export type RouterSuspenseProps = {
  /** Includes awaited loader errors. Defaults to true. */
  loaders?: boolean,
  /** Includes route props getter errors. Defaults to true. */
  props?: boolean,
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
      const isServerRendering = useIsServerRendering()

      provide(key, props.context)

      if (!isServerRendering) {
        onErrorCaptured(props.context.captureError)
      }

      return () => renderSlot(slots, 'default')
    },
  })

  const RouterSuspenseError = defineComponent({
    name: 'RouterSuspenseError',
    setup() {
      return () => h('p', { role: 'alert' }, 'Unable to load this content.')
    },
  })

  return defineComponent({
    name: 'RouterSuspense',
    inheritAttrs: false,
    props: {
      loaders: {
        type: Boolean,
        default: true,
      },
      props: {
        type: Boolean,
        default: true,
      },
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
        reportError(error, kind) {
          if (!active || isServerRendering) {
            return false
          }

          if (kind === 'props' && !props.props) {
            return false
          }

          if (kind === 'loader' && !props.loaders) {
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
        if (!failure.value) {
          return h(Suspense, attrs, {
            default: () => h(Content, { context }, slots.default),
            fallback: slots.fallback,
          })
        }

        if (slots.error) {
          return slots.error(failure.value)
        }

        return h(RouterSuspenseError)
      }
    },
  })
}
