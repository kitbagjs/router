import { computed, ComputedRef, defineComponent, h, inject, InjectionKey } from 'vue'

export type ViewTransitionProps = {
  /** The name shared by the outgoing and incoming elements. */
  name: string,
  /** The element to render. Defaults to span. */
  as?: keyof HTMLElementTagNameMap,
}

export const viewTransitionLinkKey: InjectionKey<ComputedRef<boolean>> = Symbol()

/**
 * Names an element for a view transition. Inside RouterLink the name is active only while transitioning
 * to that link's destination; elsewhere the element always carries its name.
 */
export const ViewTransition = defineComponent((props: ViewTransitionProps, { attrs, slots }) => {
  const isTransitioning = inject(viewTransitionLinkKey, undefined)
  const transitionName = computed(() => {
    return isTransitioning?.value === false ? 'none' : props.name
  })

  return () => h(props.as ?? 'span', {
    ...attrs,
    style: [attrs.style, { viewTransitionName: transitionName.value }],
  }, slots.default?.())
}, {
  name: 'ViewTransition',
  inheritAttrs: false,
  // eslint-disable-next-line vue/require-prop-types
  props: ['name', 'as'],
})
