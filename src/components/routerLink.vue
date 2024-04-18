<template>
  <a :href="resolved" :class="classes" @click="onClick">
    <slot v-bind="{ resolved, match, exactMatch, isExternal }" />
  </a>
</template>

<script setup lang="ts" generic="T extends string & keyof RegisteredRouteMap | Url">
  import { computed, readonly } from 'vue'
  import { useRouter } from '@/compositions'
  import { RegisteredRouteMap, RegisteredRoutes } from '@/types/register'
  import { RouterPushOptions } from '@/types/routerPush'
  import { RouteParamsByName } from '@/types/routeWithParams'
  import { Url, isUrl } from '@/types/url'

  const props = defineProps<{
    to: T,
    params?: T extends keyof RegisteredRouteMap ? RouteParamsByName<RegisteredRoutes, T> : undefined,
  } & RouterPushOptions>()

  defineSlots<{
    default?: (props: {
      resolved: string,
      match: boolean,
      exactMatch: boolean,
      isExternal: boolean,
    }) => unknown,
  }>()

  const router = useRouter()

  const route = computed(() => {
    const { to, params, ...options } = props
    const args = isUrl(to) ? [options] : [params, options]

    return router.find(to, ...args)?.matched
  })

  const match = computed(() => !!route.value && router.route.matches.includes(readonly(route.value)))
  const exactMatch = computed(() => !!route.value && router.route.matched === route.value)

  const classes = computed(() => ({
    'router-link--match': match.value,
    'router-link--exact-match': exactMatch.value,
  }))

  const resolved = computed(() => {
    const { to, params, ...options } = props
    const args = isUrl(to) ? [options] : [params, options]

    return router.resolve(to, ...args)
  })
  const host = computed(() => {
    const { host } = new URL(resolved.value, window.location.origin)

    return host
  })
  const isExternal = computed(() => host.value !== window.location.host)

  function onClick(event: MouseEvent): void {
    event.preventDefault()

    const { to, params, ...options } = props
    const args = isUrl(to) ? [options] : [params, options]

    router.push(to, ...args)
  }
</script>