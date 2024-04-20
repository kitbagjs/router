<template>
  <a :href="resolved" :class="classes" @click="onClick">
    <slot v-bind="{ resolved, match, exactMatch, isExternal }" />
  </a>
</template>

<script setup lang="ts" generic="T extends RegisteredRoutesKey | Url">
  import { computed, readonly } from 'vue'
  import { useRouter } from '@/compositions'
  import { RegisteredRoutes, RegisteredRoutesKey } from '@/types/register'
  import { RouterPush, RouterPushOptions } from '@/types/routerPush'
  import { RouteParamsByName } from '@/types/routeWithParams'
  import { Url } from '@/types/url'
  import { AllPropertiesAreOptional } from '@/types/utilities'
  import { RouterResolve } from '@/utilities'

  type PushMethodArgs<
    TSource extends RegisteredRoutesKey,
    TParams = RouteParamsByName<RegisteredRoutes, TSource>
  > = AllPropertiesAreOptional<TParams> extends true
    ? [params?: TParams]
    : [params: TParams]

  type PushMethod = <T extends <TSource extends RegisteredRoutesKey>(source: TSource, ...args: PushMethodArgs<TSource>) => any>(push: T) => ReturnType<T>
  const props = defineProps<{ to: string | PushMethod } & RouterPushOptions>()

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
    const { to, ...options } = props
    if (typeof to === 'string') {
      return router.find(to as any, options)?.matched
    }

    return to(router.find)?.matched
  })

  const match = computed(() => !!route.value && router.route.matches.includes(readonly(route.value)))
  const exactMatch = computed(() => !!route.value && router.route.matched === route.value)

  const classes = computed(() => ({
    'router-link--match': match.value,
    'router-link--exact-match': exactMatch.value,
  }))

  const resolved = computed(() => {
    const { to, ...options } = props
    if (typeof to === 'string') {
      return router.resolve(to as any, options)
    }

    const optionsBound: RouterResolve<RegisteredRoutes> = (source: any, params: any) => router.resolve(source, params, options)

    return to(optionsBound)
  })
  const host = computed(() => {
    const { host } = new URL(resolved.value, window.location.origin)

    return host
  })
  const isExternal = computed(() => host.value !== window.location.host)

  function onClick(event: MouseEvent): void {
    event.preventDefault()

    const { to, ...options } = props
    if (typeof to === 'string') {
      router.push(to as any, options)
      return
    }

    const optionsBound: RouterPush<RegisteredRoutes> = (source: any, params: any) => router.push(source, params, options)

    to(optionsBound)
  }
</script>