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
| viewTransition | false | [`ViewTransitionConfig`](/api/types/ViewTransitionConfig) | Animates the navigation with a [view transition](/advanced-concepts/view-transitions) |

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
You can define [external routes](/core-concepts/external-routes) in your router configuration for a type safe way to navigate to external urls.
:::

## Slots

`RouterLink` provides a default slot to render the link text. But it also exposes the following slot scopes.

| Property | Type | Description |
| --- | --- | --- |
| route | [`ResolvedRoute`](/api/types/ResolvedRoute) or `undefined` | The resolved route object for the link destination |
| isMatch | `boolean` | Whether the current route is the destination route or one of its descendants, regardless of params, query, or hash |
| isExactMatch | `boolean` | Whether the current route is the destination route itself, regardless of params, query, or hash |
| isActive | `boolean` | Whether the current URL starts with the destination URL |
| isExactActive | `boolean` | Whether the current URL equals the destination URL, including query and hash |
| isExternal | `boolean` | Whether the link points to an external URL |
| isTransitioning | `boolean` | Whether a [view transition](/advanced-concepts/view-transitions#shared-elements) to the link's location is in flight |

```vue
<router-link :to="(resolve) => resolve('profile', { userId: 123 })" v-slot="{ route, isMatch, isExactMatch, isExternal }">
  ...
</router-link>
```

## Classes

`RouterLink` adds CSS classes for the same matching and active states exposed by its slot.

| Class | Slot property |
| --- | --- |
| `router-link--match` | `isMatch` |
| `router-link--exact-match` | `isExactMatch` |
| `router-link--active` | `isActive` |
| `router-link--exact-active` | `isExactActive` |

## Matching a route or a URL

Use `isMatch` or `router-link--match` to highlight a section of your app, including its child routes. Use `isExactMatch` when only that route should count. These checks ignore param values, query, and hash: links to two different users can both match the same user route.

Use `isExactActive` or `router-link--exact-active` to highlight a link to the current URL. This distinguishes different users or tabs that share a route definition. `isActive` uses a URL prefix check, so it also stays active when the current URL starts with the link's full URL; it does not check path segment boundaries.

For a link to `/users/1`, with a `user` route at `/users/[id]` and a child route at `/users/[id]/details`:

| Current URL | `isMatch` | `isExactMatch` | `isActive` | `isExactActive` |
| --- | --- | --- | --- | --- |
| `/users/1` | `true` | `true` | `true` | `true` |
| `/users/2` | `true` | `true` | `false` | `false` |
| `/users/1/details` | `true` | `false` | `true` | `false` |

```vue
<router-link
  :to="(resolve) => resolve('user', { id: '1' })"
  v-slot="{ isExactActive }"
>
  <span :class="{ selected: isExactActive }">User 1</span>
</router-link>
```

Or style the link directly:

```css
.router-link--exact-active {
  font-weight: bold;
}
```
