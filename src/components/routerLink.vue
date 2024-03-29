<template>
  <a :href="resolved" :class="classes" @click="onClick">
    <slot v-bind="{ resolved, match, exactMatch, isExternal }" />
  </a>
</template>

<script setup lang="ts" generic="T extends string">
  import { computed, readonly } from 'vue'
  import { useRouter } from '@/compositions'
  import { RouteMethod } from '@/types/routeMethod'
  import { RouterPushOptions } from '@/types/routerPush'
  import { RegisteredRouteWithParams } from '@/types/routeWithParams'

  const props = defineProps<{
    to: string | RegisteredRouteWithParams<T> | ReturnType<RouteMethod>,
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

  const route = computed(() => router.find(props.to)?.matched)

  const match = computed(() => !!route.value && router.route.matches.includes(readonly(route.value)))
  const exactMatch = computed(() => !!route.value && router.route.matched === route.value)

  const classes = computed(() => ({
    'router-link--match': match.value,
    'router-link--exact-match': exactMatch.value,
  }))

  const resolved = computed(() => router.resolve(props.to))
  const host = computed(() => {
    const { host } = new URL(resolved.value, window.location.origin)

    return host
  })
  const isExternal = computed(() => host.value !== window.location.host)

  function onClick(event: MouseEvent): void {
    event.preventDefault()

    const { to, ...options } = props

    router.push(to, options)
  }
</script>