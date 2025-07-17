<template>
  <a ref="element" :href="href" class="router-link" :class="classes" @click="onClick">
    <slot v-bind="{ route, isMatch, isExactMatch, isActive, isExactActive, isExternal }" />
  </a>
</template>

<script lang="ts">
  /**
   * @hidden we don't want the criptic component types showing up in the api docs
   */
  export default {
    name: 'RouterLink',
  }
</script>

<script setup lang="ts">
  import { computed } from 'vue'
  import { RouterPushOptions } from '@/types/routerPush'
  import { Url, isUrl } from '@/types/url'
  import { ResolvedRoute } from '@/types/resolved'
  import { useRouter } from '@/compositions/useRouter'
  import { useLink } from '@/compositions/useLink'
  import { RouterLinkProps, ToCallback } from '@/components/routerLink'

  const props = withDefaults(defineProps<RouterLinkProps & RouterPushOptions>(), {
    // because prefetch can be a boolean vue automatically sets the default to false.
    // Specifically setting the default to undefined
    prefetch: undefined,
  })

  defineSlots<{
    default?: (props: {
      route: ResolvedRoute | undefined,
      isMatch: boolean,
      isExactMatch: boolean,
      isActive: boolean,
      isExactActive: boolean,
      isExternal: boolean,
    }) => unknown,
  }>()

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

  function getResolvedRoute(to: Url | ResolvedRoute | ToCallback | undefined): ResolvedRoute | undefined {
    if (typeof to === 'function') {
      const callbackValue = to(router.resolve)

      return getResolvedRoute(callbackValue)
    }

    return isUrl(to) ? router.find(to) : to
  }

  function getHref(to: Url | ResolvedRoute | ToCallback | undefined): Url | undefined {
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
</script>
