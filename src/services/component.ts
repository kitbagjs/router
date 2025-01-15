/* eslint-disable vue/one-component-per-file */
import { AsyncComponentLoader, Component, FunctionalComponent, defineComponent, getCurrentInstance, h, ref } from 'vue'
import { MaybePromise } from '@/types/utilities'
import { isPromise } from '@/utilities/promises'

type Constructor = new (...args: any) => any

export type ComponentProps<TComponent extends Component> = TComponent extends Constructor
  ? InstanceType<TComponent>['$props']
  : TComponent extends AsyncComponentLoader<infer T extends Component>
    ? ComponentProps<T>
    : TComponent extends FunctionalComponent<infer T>
      ? T
      : {}

type ComponentPropsGetter<TComponent extends Component> = () => MaybePromise<ComponentProps<TComponent>>

/**
 * Creates a component wrapper which has no props itself but mounts another component within while binding its props
 *
 * @param component The component to mount
 * @param props A callback that returns the props or attributes to bind to the component
 * @returns A component
 */
export function component<TComponent extends Component>(component: TComponent, props: ComponentPropsGetter<TComponent>): Component {
  return defineComponent({
    name: 'PropsWrapper',
    expose: [],
    setup() {
      const values = props()
      const instance = getCurrentInstance()

      return () => {
        if (values instanceof Error) {
          return ''
        }

        if (isPromise(values)) {
          // @ts-expect-error there isn't a way to check if suspense is used in the component without accessing a private property
          if (instance?.suspense) {
            return h(suspenseAsyncPropsWrapper(component, values))
          }

          return h(asyncPropsWrapper(component, values))
        }

        return h(component, values)
      }
    },
  })
}

/**
 * Creates a component wrapper that binds async props which does not require suspense
 */
function asyncPropsWrapper<TComponent extends Component>(component: TComponent, props: Promise<ComponentProps<TComponent>>): Component {
  return defineComponent({
    name: 'AsyncPropsWrapper',
    expose: [],
    setup() {
      const values = ref()

      ;(async () => {
        values.value = await props
      })()

      return () => {
        if (values.value instanceof Error) {
          return ''
        }

        if (values.value) {
          return h(component, values.value)
        }

        return ''
      }
    },
  })
}

/**
 * Creates a component wrapper that binds async props which requires suspense
 */
function suspenseAsyncPropsWrapper<TComponent extends Component>(component: TComponent, props: Promise<ComponentProps<TComponent>>): Component {
  return defineComponent({
    name: 'SuspenseAsyncPropsWrapper',
    expose: [],
    async setup() {
      const values = await props

      return () => h(component, values)
    },
  })
}
