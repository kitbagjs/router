<template>
  <a :href="resolved" class="router-link" :class="classes" @click="onClick">
    <slot v-bind="{ resolved, isMatch, isExactMatch, isExternal }" />
  </a>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter, useLink } from '@/compositions'
  import { PrefetchConfig } from '@/types/prefetch'
  import { RegisteredRouter } from '@/types/register'
  import { RouterPushOptions } from '@/types/routerPush'
  import { Url, isUrl } from '@/types/url'

  type ToCallback = (resolve: RegisteredRouter['resolve']) => string

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

  const props = defineProps<RouterLinkProps & RouterPushOptions>()

  defineSlots<{
    default?: (props: {
      resolved: string,
      isMatch: boolean,
      isExactMatch: boolean,
      isExternal: boolean,
    }) => unknown,
  }>()

  const router = useRouter()

  const resolved = computed(() => {
    return isUrl(props.to) ? props.to : props.to(router.resolve)
  })

  const options = computed(() => {
    const { to, ...options } = props

    return options
  })

  const { href, isMatch, isExactMatch } = useLink(resolved)

  const classes = computed(() => ({
    'router-link--match': isMatch.value,
    'router-link--exact-match': isExactMatch.value,
  }))

  const isExternal = computed(() => {
    return router.isExternal(resolved.value)
  })

  function onClick(event: MouseEvent): void {
    event.preventDefault()

    router.push(href.value, options.value)
  }
</script>