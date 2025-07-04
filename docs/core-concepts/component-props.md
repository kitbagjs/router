# Component Props

With Kitbag Router, you can define a `props` callback on your route. Your callback is given the [`ResolvedRoute`](/api/types/ResolvedRoute) for the route and what it returns will be bound to the component when the component gets mounted inside the `<router-view />`

```ts {5}
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
  component: UserComponent,
}, (route) => ({ userId: route.params.id }))
```

This is obviously useful for assigning static values or route params down to your view components props but it also gives you

- Correct types on the route's params, query, etc.
- Correct type for return type.
- Support for async prop fetching.

## Named Views
When using the [`components`](/core-concepts/routes.html#components) property the `props` argument must be an object. Each component can have its own props callback.

```ts {5-6,9-10}
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
  components: {
    defailt: UserComponent,
    sidebar: UserSidebarComponent,
  }
}, {
  default: (route) => ({ userId: route.params.id }),
  sidebar: (route) => ({ userId: route.params.id })
})
```

## Params Type

The params passed to your callback has all of the type context including params from parents and any defaults applied.

## Return Type

Your callback will throw a Typescript error if it returns anything other than the type defined by the component for props. This also means that if your route's component has required props, you'll get an error until you satisfy this requirement.

## Async prop fetching

The props call back supports promises. This means you can do much more than just forward values from params or insert static values. For example, we can take an id route param and fetch the `User` before mounting the component.

```ts {5-9}
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
  component: UserComponent,
}, async (route) => {
  const user = await userStore.getById(route.params.id)

  return { user }
})
```

## Parent Props

The [callback context](/core-concepts/component-props#context) includes a `parent` property which contains the name and props of the parent route. This can be useful for passing down data to child components.

```ts
const blogPost = createRoute({
  name: 'blog',
  path: '/blog/[blogPostId]'
}, async (route) => {
  const post = await getBlockPostById(route.params.blogPostId)

  return {
    post
  }
})

const blogPostTabs = createRoute({
  parent: blogPost,
  name: 'tabs',
  query: '?tab=[tab]'
  component: PostTabs,
}, async (route, { parent }) => {
  const tab = route.query.tab
  const { post } = await parent.props

  return { 
    tab,
    post
  }
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
| parent | And object containing the name and props of the parent route. |
| replace | Same as push, but with `options: { replace: true }`. |
| reject | Trigger a [rejection](/advanced-concepts/rejections) for the router to handle |

::: warning
Unlike [hooks](/advanced-concepts/hooks), props are not awaited during navigation. This means that any parent components will be mounted and any [After Hooks](/advanced-concepts/hooks#after-hooks) will start while any async prop fetching is happening.
:::

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
  component: UserComponent,
}, async (route, { reject }) => {
  try {
    const user = await userStore.getById(route.params.id)

    return { user }
  } catch (error) {
    reject('NotFound')
  }
}))
```

## Global Injection

Props are run within the context of the Vue app the router is installed. This means you can use vue's `inject` function to access global values.

```ts
import { inject } from 'vue'

const route = createRoute({
  ...
}, async () => {
  const value = inject('global')

  return { value }
})
```