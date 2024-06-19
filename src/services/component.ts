/* eslint-disable vue/one-component-per-file */
import { AsyncComponentLoader, Component, FunctionalComponent, defineComponent, h } from 'vue'
import { MaybePromise } from '@/types/utilities'

type Constructor = new (...args: any) => any

type Props<TComponent extends Component> = TComponent extends Constructor
  ? InstanceType<TComponent>['$props']
  : TComponent extends AsyncComponentLoader<infer T extends Component>
    ? Props<T>
    : TComponent extends FunctionalComponent<infer T>
      ? T
      : never

type PropsGetter<TComponent extends Component> = () => MaybePromise<Props<TComponent>>

/**
 * Creates a component wrapper which has no props itself but mounts another component within while binding its props
 *
 * @param component The component to mount
 * @param props A callback that returns the props or attributes to bind to the component
 * @returns A component
 *
 * @example
 * ```ts
 * import { createRoutes, component } from '@kitbag/router'
 *
 * export const routes = createRoutes([
 *   {
 *     name: 'User',
 *     path: '/',
 *     component: component(User, () => ({ userId: 1 }))
 *   },
 * ])
 * ```
 */
export function component<TComponent extends Component>(component: TComponent, props: PropsGetter<TComponent>): Component {
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

function asyncPropsWrapper<TComponent extends Component>(component: TComponent, props: Promise<Props<TComponent>>): Component {
  return defineComponent({
    name: 'AsyncPropsWrapper',
    expose: [],
    async setup() {
      const values = await props

      return () => h(component, values)
    },
  })
}