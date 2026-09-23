import { defineComponent, h, InjectionKey, ref, watch } from 'vue'
import { createUseNavigation } from '@/compositions/useNavigation'
import { routerProgressBar } from '@/components/routerProgressBar'
import { Router } from '@/types/router'

export type RouterProgressProps = {
  /**
   * How long a navigation must be pending before the bar appears, in milliseconds. Fast navigations never
   * flash a bar. Defaults to 150.
   */
  delay?: number,
  /**
   * The color of the bar. Defaults to the `--router-progress-color` custom property, then a blue.
   */
  color?: string,
  /**
   * The accessible name of the bar, read out by screen readers. Defaults to "Loading page".
   */
  label?: string,
}

// Inferring the return type of the component is more accurate than defining it manually
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createRouterProgress<TRouter extends Router>(routerKey: InjectionKey<TRouter>) {
  const useNavigation = createUseNavigation(routerKey)

  return defineComponent((props: RouterProgressProps) => {
    const navigation = useNavigation()
    const { pending, to } = navigation
    const navigations = ref(0)

    // a navigation begun while another is pending leaves pending true, so the route it leads to is what changes
    watch([pending, to], ([isPending]) => {
      if (isPending) {
        navigations.value += 1
      }
    })

    return () => h(routerProgressBar, {
      key: navigations.value,
      navigation,
      delay: props.delay ?? 150,
      color: props.color,
      label: props.label ?? 'Loading page',
    })
  }, {
    name: 'RouterProgress',
    // The prop types are defined above. Vue requires manually defining the prop names themselves here to distinguish from attrs
    // eslint-disable-next-line vue/require-prop-types
    props: ['delay', 'color', 'label'],
  })
}
