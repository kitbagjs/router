/* eslint-disable vue/require-prop-types */
/* eslint-disable vue/one-component-per-file */
import { AsyncComponentLoader, Component, FunctionalComponent, InjectionKey, defineComponent, getCurrentInstance, h, ref, watch } from 'vue'
import { isPromise } from '@/utilities/promises'
import { CreatedRouteOptions } from '@/types/route'
import { createUsePropStore } from '@/compositions/usePropStore'
import { useRoute } from '@/compositions/useRoute'
import { Router } from '@/types/router'

type Constructor = new (...args: any) => any

export type ComponentProps<TComponent extends Component> = TComponent extends Constructor
  ? InstanceType<TComponent>['$props']
  : TComponent extends AsyncComponentLoader<infer T extends Component>
    ? ComponentProps<T>
    : TComponent extends FunctionalComponent<infer T>
      ? T
      : {}

type CreateComponentWrapperConfig = {
  match: CreatedRouteOptions,
  name: string,
  component: Component,
}

export function createComponentPropsWrapper(routerKey: InjectionKey<Router>, { match, name, component }: CreateComponentWrapperConfig): Component {
  const usePropStore = createUsePropStore(routerKey)

  return defineComponent({
    name: 'PropsWrapper',
    expose: [],
    setup() {
      const instance = getCurrentInstance()
      const store = usePropStore()
      const route = useRoute()

      return () => {
        const props = store.getProps(match.id, name, route)

        if (props instanceof Error) {
          return ''
        }

        if (isPromise(props)) {
          // @ts-expect-error there isn't a way to check if suspense is used in the component without accessing a private property
          if (instance?.suspense) {
            return h(SuspenseAsyncComponentPropsWrapper, { component, props })
          }

          return h(AsyncComponentPropsWrapper, { component, props })
        }

        return h(component, props)
      }
    },
  })
}

const AsyncComponentPropsWrapper = defineComponent((input: { component: Component, props: unknown }) => {
  const values = ref()

  watch(() => input.props, async (props) => {
    values.value = await props
  }, { immediate: true, deep: true })

  return () => {
    if (values.value instanceof Error) {
      return ''
    }

    if (values.value) {
      return h(input.component, values.value)
    }

    return ''
  }
}, {
  props: ['component', 'props'],
})

const SuspenseAsyncComponentPropsWrapper = defineComponent(async (input: { component: Component, props: unknown }) => {
  const values = ref()

  values.value = await input.props

  watch(() => values.value, async (props) => {
    values.value = await props
  }, { deep: true })

  return () => {
    if (values.value instanceof Error) {
      return ''
    }

    if (values.value) {
      return h(input.component, values.value)
    }

    return ''
  }
}, {
  props: ['component', 'props'],
})
