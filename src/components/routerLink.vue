<template>
  <a ref="element" :href="href" class="router-link" :class="classes" @click="onClick">
    <slot v-bind="{ route, isMatch, isExactMatch, isExternal }" />
  </a>
</template>

<script lang="ts">
/**
 * @ignore
 */
</script>

<script setup lang="ts">
  import { computed } from 'vue'
  import { PrefetchConfig } from '@/types/prefetch'
  import { RegisteredRouter } from '@/types/register'
  import { RouterPushOptions } from '@/types/routerPush'
  import { Url, isUrl } from '@/types/url'
  import { ResolvedRoute } from '@/types/resolved'
  import { useRouter } from '@/compositions/useRouter'
  import { UseLink, useLink } from '@/compositions/useLink'

  type ToCallback = (resolve: RegisteredRouter['resolve']) => ResolvedRoute | undefined

  type RouterLinkProps = {
    /**
     * The url string to navigate to or a callback that returns a url string
     */
    to: Url | ToCallback,
    /**
     * Determines what assets are prefetched when router-link is rendered for this route. Overrides route level prefetch.
     */
    prefetch?: PrefetchConfig,
  }

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
      isExternal: boolean,
    }) => unknown,
  }>()

  const router = useRouter()

  const route = computed(() => {
    return isUrl(props.to) ? router.resolve(props.to) : props.to(router.resolve)
  })

  const href = computed(() => {
    if (route.value) {
      return route.value.href
    }

    if(isUrl(props.to)){
      return props.to
    }

    throw new Error('Failed to resolve route in RouterLink.')
  })

  const options = computed(() => {
    const { to, ...options } = props

    return options
  })

  const { element, isMatch, isExactMatch, isExternal, push } = createUseLink()

  const classes = computed(() => ({
    'router-link--match': isMatch.value,
    'router-link--exact-match': isExactMatch.value,
  }))

  function createUseLink(): UseLink {
    if (route.value) {
      return useLink(route.value, options)
    }

    if (isUrl(props.to)) {
      return useLink(props.to, options)
    }

    throw new Error('Failed to resolve route in RouterLink.')
  }

  function onClick(event: MouseEvent): void {
    event.preventDefault()

    push()
  }
</script>
