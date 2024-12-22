# RouterLink
The router link component is a wrapper around the anchor element. It is registered globally by the [router plugin](/quick-start#vue-plugin). 

## Props
| Prop | Required | Type | Description |
| --- | --- | --- | --- |
| to | true | [`Url`](/api/types/Url), [`ResolvedRoute`](/api/types/ResolvedRoute), or [`ToCallback`](/api/types/ToCallback) | The location to navigate to when clicked |
| replace | false | `boolean` | When true, replaces the current history entry instead of adding a new one |
| prefetch | false | `boolean`, [`PrefetchStrategy`](/api/types/PrefetchStrategy) or [`PrefetchConfig`](/api/types/PrefetchConfig) | Controls what assets are prefetched when the link is rendered |
| query | false | [`QuerySource`](/api/types/QuerySource) | Query parameters to append to the URL |
| hash | false | `string` | URL hash fragment to append |
| state | false | `unknown` | State object to associate with the history entry |

### The `to` prop
The `to` prop determines the the href attribute of the anchor element. The `to` prop can be a [Url](/api/types/Url), a [ResolvedRoute](/api/types/ResolvedRoute), or a getter that returns either type. 

### Using a [ResolvedRoute](/api/types/ResolvedRoute)

Using a [ResolvedRoute](/api/types/ResolvedRoute) is the recommended way to navigate to a predefined route. When the `to` prop is a getter the router's resolve function is passed in as an argument. Here are two ways of creating the same link.

```vue
<router-link :to="(resolve) => resolve('profile', { userId: 123 })">Profile</router-link>
```
```vue
<script setup lang="ts">
  import { useRouter } from '@kitbag/router'

  const router = useRouter()
  const profileRoute = router.resolve('profile', { userId: 123 })
</script>

<template>
  <router-link :to="profileRoute">Profile</router-link>
</template>
```

### Using a [Url](/api/types/Url)
As a convenience, you can also use a [Url](/api/types/Url) for the `to` prop. This is not type safe and is not recommended. But it can be useful for creating links to external sites. 

```vue
<router-link to="https://example.com">External Link</router-link>
```
::: info External Routes
You can define [external routes](/core-concepts/defining-routes#external-routes) in your router configuration for a type safe way to navigate to external urls.
:::

## Slots
`RouterLink` provides a default slot to render the link text. But it also exposes the following slot scopes.

| Property | Type | Description |
| --- | --- | --- |
| route | [`ResolvedRoute`](/api/types/ResolvedRoute) or `undefined` | The resolved route object for the link destination |
| isMatch | `boolean` | Whether the current route matches the link's location |
| isExactMatch | `boolean` | Whether the current route exactly matches the link's location |
| isExternal | `boolean` | Whether the link points to an external URL |

```vue
<router-link :to="(resolve) => resolve('profile', { userId: 123 })" v-slot="{ route, isMatch, isExactMatch, isExternal }">
  ...
</router-link>
```

## Classes
The `RouterLink` component will automatically add the `router-link--match` class to the anchor element when the current route matches the route specified in the `to` prop. It will also add the `router-link--exact-match` class when the current route matches the route specified in the `to` prop exactly.
