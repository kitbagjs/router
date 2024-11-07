/* eslint-disable vue/one-component-per-file */
import { AsyncComponentLoader, Component, FunctionalComponent, defineComponent, h, ref } from 'vue'
import { MaybePromise } from '@/types/utilities'

type Constructor = new (...args: any) => any

export type ComponentProps<TComponent extends Component> = TComponent extends Constructor
  ? InstanceType<TComponent>['$props']
  : TComponent extends AsyncComponentLoader<infer T extends Component>
    ? ComponentProps<T>
    : TComponent extends FunctionalComponent<infer T>
      ? T
      : never

type ComponentPropsGetter<TComponent extends Component> = () => MaybePromise<ComponentProps<TComponent>>

/**
 * Creates a component wrapper which has no props itself but mounts another component within while binding its props
 *
 * @param component The component to mount
 * @param props A callback that returns the props or attributes to bind to the component
 * @returns A component
 *
 * @example
 * ```ts
 * import { createRoute, component } from '@kitbag/router'
 *
 * export const routes = createRoute({
 *   name: 'User',
 *   path: '/',
 *   component: component(User, () => ({ userId: 1 }))
 * })
 * ```
 */
export function component<TComponent extends Component>(component: TComponent, props: ComponentPropsGetter<TComponent>): Component {
  return defineComponent({
    name: 'PropsWrapper',
    expose: [],
    setup() {
      const values = props()

      if ('then' in values) {
        return () => h(asyncPropsWrapper(component, values))
      }

      return () => h(component, values)
    },
  })
}

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
        if (values.value) {
          return h(component, values.value)
        }

        return ''
      }
    },
  })
}
