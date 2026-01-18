import { isUrlString, UrlString } from '@/types/urlString'
import { ResolvedRoute } from '@/types/resolved'
import { computed, defineComponent, EmitsOptions, h, InjectionKey, SetupContext, SlotsType, VNode } from 'vue'
import { createUseRouter } from '@/compositions/useRouter'
import { Router } from '@/types/router'
import { createUseLink } from '@/compositions/useLink'
import { RouterLinkProps, ToCallback } from '@/types/routerLink'

type RouterLinkSlots = {
  default?: (props: {
    route: ResolvedRoute | undefined,
    isMatch: boolean,
    isExactMatch: boolean,
    isActive: boolean,
    isExactActive: boolean,
    isExternal: boolean,
  }) => VNode[],
}

// Inferring the return type of the component is more accurate than defining it manually
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createRouterLink<TRouter extends Router>(routerKey: InjectionKey<TRouter>) {
  const useRouter = createUseRouter(routerKey)
  const useLink = createUseLink(routerKey)

  return defineComponent((props: RouterLinkProps<TRouter>, context: SetupContext<EmitsOptions, SlotsType<RouterLinkSlots>>) => {
    const router = useRouter()

    const route = computed<ResolvedRoute | undefined>(() => getResolvedRoute(props.to))

    const href = computed<UrlString | undefined>(() => getHref(props.to))

    const options = computed(() => {
      const { to, ...options } = props

      return options
    })

    const { element, isMatch, isExactMatch, isActive, isExactActive, isExternal, push } = useLink(() => {
      if (typeof props.to === 'function') {
        return props.to(router.resolve)
      }

      return props.to
    }, options)

    const classes = computed(() => ({
      'router-link--match': isMatch.value,
      'router-link--exact-match': isExactMatch.value,
      'router-link--active': isActive.value,
      'router-link--exact-active': isExactActive.value,
    }))

    function getResolvedRoute(to: UrlString | ResolvedRoute | ToCallback<TRouter> | undefined): ResolvedRoute | undefined {
      if (typeof to === 'function') {
        const callbackValue = to(router.resolve)

        return getResolvedRoute(callbackValue)
      }

      return isUrlString(to) ? router.find(to) : to
    }

    function getHref(to: UrlString | ResolvedRoute | ToCallback<TRouter> | undefined): UrlString | undefined {
      if (typeof to === 'function') {
        const callbackValue = to(router.resolve)

        return getHref(callbackValue)
      }

      if (isUrlString(to)) {
        return to
      }

      return to?.href
    }

    function onClick(event: MouseEvent): void {
      event.preventDefault()

      push()
    }

    return () => {
      return h('a', {
        href: href.value,
        class: ['router-link', classes.value],
        ref: element,
        onClick,
      }, context.slots.default?.({
        route: route.value,
        isMatch: isMatch.value,
        isExactMatch: isExactMatch.value,
        isActive: isActive.value,
        isExactActive: isExactActive.value,
        isExternal: isExternal.value,
      }),
      )
    }
  }, {
    name: 'RouterLink',
    // The prop types are defined above. Vue requires manually defining the prop names themselves here to distinguish from attrs
    // eslint-disable-next-line vue/require-prop-types
    props: ['to', 'prefetch', 'query', 'hash', 'replace', 'state'],
  })
}
