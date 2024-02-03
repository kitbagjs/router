<template>
  <a :href="resolve()" @click="onClick">
    <slot />
  </a>
</template>

<script setup lang="ts" generic="T extends string">
  import { useRouter } from '@/compositions'
  import { RouteMethod } from '@/types/routeMethod'
  import { RegisteredRouteWithParams } from '@/types/routeWithParams'
  import { RouterPushOptions } from '@/utilities/createRouterPush'

  const props = defineProps<{
    to: string | RegisteredRouteWithParams<T> | ReturnType<RouteMethod>,
  } & RouterPushOptions>()

  const router = useRouter()

  function resolve(): string {
    return router.resolve(props.to)
  }

  function onClick(event: MouseEvent): void {
    event.preventDefault()

    const { to, ...options } = props

    router.push(props.to, options)
  }
</script>