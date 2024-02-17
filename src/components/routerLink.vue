<template>
  <a :href="resolve()" :class="classes" @click="onClick">
    <slot />
  </a>
</template>

<script setup lang="ts" generic="T extends string">
  import { computed } from 'vue'
  import { useRouter } from '@/compositions'
  import { RouteMethod } from '@/types/routeMethod'
  import { RegisteredRouteWithParams } from '@/types/routeWithParams'
  import { RouterPushOptions } from '@/utilities/createRouterPush'

  const props = defineProps<{
    to: string | RegisteredRouteWithParams<T> | ReturnType<RouteMethod>,
  } & RouterPushOptions>()

  const router = useRouter()

  const route = computed(() => router.find(props.to)?.matched)

  const inMatches = computed(() => !!route.value && router.route.matches.includes(route.value))
  const isMatched = computed(() => !!route.value && router.route.matched === route.value)

  const classes = computed(() => ({
    'router-link--matches': inMatches.value,
    'router-link--exact-match': isMatched.value,
  }))

  function resolve(): string {
    return router.resolve(props.to)
  }

  function onClick(event: MouseEvent): void {
    event.preventDefault()

    const { to, ...options } = props

    router.push(to, options)
  }
</script>