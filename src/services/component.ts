/* eslint-disable vue/require-prop-types */
/* eslint-disable vue/one-component-per-file */
import { AsyncComponentLoader, Component, FunctionalComponent, defineComponent, getCurrentInstance, h, ref, watch } from 'vue'
import { isPromise } from '@/utilities/promises'

type Constructor = new (...args: any) => any

export type ComponentProps<TComponent extends Component> = TComponent extends Constructor
  ? InstanceType<TComponent>['$props']
  : TComponent extends AsyncComponentLoader<infer T extends Component>
    ? ComponentProps<T>
    : TComponent extends FunctionalComponent<infer T>
      ? T
      : {}

/**
 * Creates a component wrapper which has no props itself but mounts another component within while binding its props
 *
 * @param component The component to mount
 * @returns A component that expects `props` to be passed in as a single prop value
 */
export function createComponentPropsWrapper(component: Component): Component {
  return defineComponent({
    name: 'PropsWrapper',
    expose: [],
    props: ['props'],
    setup(props: { props: unknown }) {
      const instance = getCurrentInstance()

      return () => {
        if (props.props instanceof Error) {
          return ''
        }

        if (isPromise(props.props)) {
          // @ts-expect-error there isn't a way to check if suspense is used in the component without accessing a private property
          if (instance?.suspense) {
            return h(SuspenseAsyncComponentPropsWrapper, { component, props: props.props })
          }

          return h(AsyncComponentPropsWrapper, { component, props: props.props })
        }

        return h(component, props.props)
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
