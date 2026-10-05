import { computed, ComputedRef, defineComponent, h, inject, InjectionKey, NativeElements, ComponentPublicInstance, HTMLAttributes } from 'vue'

type ElementAttributes<TElement extends keyof HTMLElementTagNameMap> = TElement extends keyof NativeElements
  ? NativeElements[TElement]
  : HTMLAttributes

export type ViewTransitionProps<TElement extends keyof HTMLElementTagNameMap = 'span'> = {
  /** The name shared by the outgoing and incoming elements. */
  name: string,
  /** The element to render. Defaults to span. */
  as?: TElement,
} & Omit<ElementAttributes<NoInfer<TElement>>, 'name'>

type ViewTransitionComponent = new <TElement extends keyof HTMLElementTagNameMap = 'span'>(
  props: ViewTransitionProps<TElement>,
) => ComponentPublicInstance<ViewTransitionProps<TElement>>

export const viewTransitionLinkKey: InjectionKey<ComputedRef<boolean>> = Symbol()

/**
 * Names an element for a view transition. Inside RouterLink the name is active only while transitioning
 * to that link's destination; elsewhere the element always carries its name.
 */
export const ViewTransition = defineComponent((props: ViewTransitionProps<keyof HTMLElementTagNameMap>, { attrs, slots }) => {
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
}) as ViewTransitionComponent
