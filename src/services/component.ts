/* eslint-disable vue/require-prop-types */
/* eslint-disable vue/one-component-per-file */
import { AsyncComponentLoader, Component, computed, FunctionalComponent, InjectionKey, defineComponent, h, ref, watch } from 'vue'
import { isPromise } from '@/utilities/promises'
import { getRouteProps } from '@/services/getRouteProps'
import { PropsResult } from '@/utilities/props'
import { createUseRouterNavigation } from '@/compositions/useRouterNavigation'
import { Router } from '@/types/router'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'
import { useHasSuspenseBoundary } from '@/compositions/useHasSuspenseBoundary'
import { createUseRouterSuspense } from '@/compositions/useRouterSuspense'

type Constructor = new (...args: any) => any

export type ComponentProps<TComponent extends Component> = TComponent extends Constructor
  ? InstanceType<TComponent>['$props']
  : TComponent extends AsyncComponentLoader<infer T extends Component>
    ? ComponentProps<T>
    : TComponent extends FunctionalComponent<infer T>
      ? T
      : {}

type CreateComponentWrapperConfig = {
  id: string,
  name: string,
  component: Component,
}

export function createComponentPropsWrapper(routerKey: InjectionKey<Router>, { id, name, component }: CreateComponentWrapperConfig): Component {
  const useRouterNavigation = createUseRouterNavigation(routerKey)
  const useRouterSuspense = createUseRouterSuspense(routerKey)

  return defineComponent({
    name: 'PropsWrapper',
    expose: [],
    setup() {
      const { active } = useRouterNavigation()
      const isServerRendering = useIsServerRendering()
      const hasSuspenseBoundary = useHasSuspenseBoundary()
      const reportError = useRouterSuspense('props')
      const props = computed(() => {
        if (!active.value?.route) {
          return { kind: 'abandoned' } as const
        }

        const { route, store } = active.value
        const depth = route.views.findIndex((match) => match.id === id)

        return getRouteProps(store, { depth, name }, route)
      })

      watch(props, async (props) => {
        const owner = active.value
        const result = await props
        const current = active.value

        if (current !== owner || result.kind !== 'error') {
          return
        }

        reportError(result.error)
      }, { immediate: true, flush: 'post' })

      return () => {
        const result = props.value

        if (isPromise(result)) {
          if (isServerRendering || hasSuspenseBoundary) {
            return h(SuspenseAsyncComponentPropsWrapper, { component, props: result })
          }

          return h(AsyncComponentPropsWrapper, { component, props: result })
        }

        return renderResult(component, result)
      }
    },
  })
}

const AsyncComponentPropsWrapper = defineComponent((input: { component: Component, props: Promise<PropsResult> }) => {
  const result = ref<PropsResult>()

  watch(() => input.props, async (props) => {
    result.value = await props
  }, { immediate: true, deep: true })

  return () => renderResult(input.component, result.value)
}, {
  props: ['component', 'props'],
})

const SuspenseAsyncComponentPropsWrapper = defineComponent(async (input: { component: Component, props: Promise<PropsResult> }) => {
  const result = ref<PropsResult>()

  result.value = await input.props

  watch(() => input.props, async (props) => {
    result.value = await props
  }, { deep: true })

  return () => renderResult(input.component, result.value)
}, {
  props: ['component', 'props'],
})

/**
 * Renders the component with whatever the getter settled on. No result means the promise has not resolved.
 */
function renderResult(component: Component, result: PropsResult | undefined): ReturnType<typeof h> | string {
  if (result === undefined || result.kind === 'error' || result.kind === 'abandoned') {
    return ''
  }

  return h(component, result.value)
}
