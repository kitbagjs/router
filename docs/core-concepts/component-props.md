# Component Props

With Kitbag Router, you can pass a `props` getter in the options when adding a view with [`addView`](/core-concepts/routes#views). Your callback is given the [`ResolvedRoute`](/api/types/ResolvedRoute) for the route and what it returns will be bound to the component when the component gets mounted inside the `<router-view />`

```ts {5-7}
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
})
.addView(UserComponent, {
  props: (route) => ({ userId: route.params.id }),
})
```

This is obviously useful for assigning static values or route params down to your view components props but it also gives you

- Correct types on the route's params, query, etc.
- Correct type for return type.
- Support for async prop fetching.

## Reusable Views

Use `createView` to share a component and props getter across routes. The getter receives the resolved route, including its loader data, and its result is checked against the component's props. Views can be passed [context](/advanced-concepts/context) to enable them to reference other routes and rejections:

```ts
import { createView } from '@kitbag/router'
import SidebarComponent from './SidebarComponent.vue'

const sidebarView = createView({
  component: SidebarComponent,
  props: (route) => ({ url: route.href }),
})
```

Pass the view to `addView` with the name `sidebar` on each route:

```ts
const home = createRoute({...})
  .addView(sidebarView, { name: 'sidebar' })

const about = createRoute({...})
  .addView(sidebarView, { name: 'sidebar' })
```

## Named Views
Each [named view](/core-concepts/routes#named-views) can have its own props getter. Just pass a `props` getter alongside the view's `name`.

```ts {5-11}
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
})
.addView(UserComponent, {
  props: (route) => ({ userId: route.params.id }),
})
.addView(UserSidebarComponent, {
  name: 'sidebar',
  props: (route) => ({ userId: route.params.id }),
})
```

## Params Type

The callback receives the resolved route. Its `params` include types from parents and any defaults applied.

<aside class="version-note" role="note">

**Version note:** Props callbacks receive the resolved route rather than just params since [0.13.0](/upgrading/0.13.0). Props moved to a second factory argument in [0.16.0](/upgrading/0.16.0), then to `addView` in [0.25.0](/upgrading/0.25.0#view-options).

</aside>

## Return Type

Your callback will throw a Typescript error if it returns anything other than the type defined by the component for props. This also means that if your route's component has required props, you'll get an error until you satisfy this requirement.

## Async prop fetching

The props call back supports promises. This means you can do much more than just forward values from params or insert static values. For example, we can take an id route param and fetch the `User` before mounting the component.

```ts {5-11}
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
})
.addView(UserComponent, {
  props: async (route) => {
    const user = await userStore.getById(route.params.id)

    return { user }
  },
})
```

## Parent Props

The [callback context](#context) includes `parent.getProps` for reading parent props.

```ts
const blogPost = createRoute({
  name: 'blog',
  path: '/blog/[blogPostId]',
})
.addView(BlogPost, {
  props: async (route) => {
    const post = await getBlogPostById(route.params.blogPostId)

    return {
      post,
    }
  },
})

const blogPostTabs = createRoute({
  parent: blogPost,
  name: 'tabs',
  query: '?tab=[tab]',
})
.addView(PostTabs, {
  props: async (route, { parent }) => {
    const tab = route.params.tab
    const { post } = await parent.getProps()

    return {
      tab,
      post,
    }
  },
})
```

:::warning
Awaiting parent props will create a waterfall of async operations which can make your app feel sluggish.
:::

## Context

The router provides a second `context` argument to your props callback. The context will always include:

| Property | Description |
| ---- | ---- |
| push | Convenient way to move the user from wherever they were to a new route. |
| parent | The parent's name, `getData`, and `getProps`. |
| replace | Same as push, but with `options: { replace: true }`. |
| reject | Trigger a [rejection](/advanced-concepts/rejections) for the router to handle |
| signal | An `AbortSignal` that aborts when the router navigates away from the route. |

::: warning
Unlike [hooks](/advanced-concepts/hooks), props are not awaited during navigation. This means that any parent components will be mounted and any [After Hooks](/advanced-concepts/hooks#after-hooks) will start while any async prop fetching is happening.
:::

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
})
.addView(UserComponent, {
  props: async (route, { reject }) => {
    try {
      const user = await userStore.getById(route.params.id)

      return { user }
    } catch (error) {
      reject('NotFound')
    }
  },
})
```

## Global Injection

Props are run within the context of the Vue app the router is installed. This means you can use vue's `inject` function to access global values.

```ts
import { inject } from 'vue'

const route = createRoute({
  ...
})
.addView(SomeComponent, {
  props: async () => {
    const value = inject('global')

    return { value }
  },
})
```
