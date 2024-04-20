<template>
  <a :href="resolved" :class="classes" @click="onClick">
    <slot v-bind="{ resolved, match, exactMatch, isExternal }" />
  </a>
</template>

<script setup lang="ts">
  import { computed, readonly } from 'vue'
  import { useRouter } from '@/compositions'
  import { RegisteredRouter } from '@/types/register'
  import { RouterPushOptions } from '@/types/routerPush'

  type ToCallback = (resolve: RegisteredRouter['resolve']) => string

  const props = defineProps<{ to: string | ToCallback } & RouterPushOptions>()

  defineSlots<{
    default?: (props: {
      resolved: string,
      match: boolean,
      exactMatch: boolean,
      isExternal: boolean,
    }) => unknown,
  }>()

  const router = useRouter()

  const resolved = computed(() => {
    return typeof props.to === 'string' ? props.to : props.to(router.resolve)
  })

  const options = computed(() => {
    const { to, ...options } = props

    return options
  })

  const route = computed(() => {
    return router.find(resolved.value, options.value)?.matched
  })

  const match = computed(() => !!route.value && router.route.matches.includes(readonly(route.value)))
  const exactMatch = computed(() => !!route.value && router.route.matched === route.value)

  const classes = computed(() => ({
    'router-link--match': match.value,
    'router-link--exact-match': exactMatch.value,
  }))

  const isExternal = computed(() => {
    const { host } = new URL(resolved.value, window.location.origin)

    return host !== window.location.host
  })

  function onClick(event: MouseEvent): void {
    event.preventDefault()

    router.push(resolved.value, options.value)
  }
</script>