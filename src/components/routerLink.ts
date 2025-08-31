import { PrefetchConfig } from '@/types/prefetch'
import { isUrl, Url } from '@/types/url'
import { ResolvedRoute } from '@/types/resolved'
import { computed, defineComponent, EmitsOptions, h, InjectionKey, SetupContext, SlotsType, VNode } from 'vue'
import { createUseRouter, routerInjectionKey } from '@/compositions/useRouter'
import { Router } from '@/types/router'
import { useLink } from '@/compositions'
import { RouterPushOptions } from '@/types/routerPush'

export type ToCallback<TRouter extends Router> = (resolve: TRouter['resolve']) => ResolvedRoute | Url | undefined

export type RouterLinkProps<TRouter extends Router> = RouterPushOptions & {
  /**
   * The url string to navigate to or a callback that returns a url string
   */
  to: Url | ResolvedRoute | ToCallback<TRouter>,
  /**
   * Determines what assets are prefetched when router-link is rendered for this route. Overrides route level prefetch.
   */
  prefetch?: PrefetchConfig,
}

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

// Infering the return type of the component is more accurate than defining it manually
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createRouterLink<TRouter extends Router>(key: InjectionKey<TRouter>) {
  const useRouter = createUseRouter(key)

  return defineComponent((props: RouterLinkProps<TRouter>, context: SetupContext<EmitsOptions, SlotsType<RouterLinkSlots>>) => {
    const router = useRouter()

    const route = computed<ResolvedRoute | undefined>(() => getResolvedRoute(props.to))

    const href = computed<Url | undefined>(() => getHref(props.to))

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

    function getResolvedRoute(to: Url | ResolvedRoute | ToCallback<TRouter> | undefined): ResolvedRoute | undefined {
      if (typeof to === 'function') {
        const callbackValue = to(router.resolve)

        return getResolvedRoute(callbackValue)
      }

      return isUrl(to) ? router.find(to) : to
    }

    function getHref(to: Url | ResolvedRoute | ToCallback<TRouter> | undefined): Url | undefined {
      if (typeof to === 'function') {
        const callbackValue = to(router.resolve)

        return getHref(callbackValue)
      }

      if (isUrl(to)) {
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

export const RouterLink = createRouterLink(routerInjectionKey)
