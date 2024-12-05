# Component Props

With Kitbag Router, you can define a `props` callback on your route. Your callback is given the [`ResolvedRoute`](/api/types/ResolvedRoute) for the route and what it returns will be bound to the component when the component gets mounted inside the `<router-view />`

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
  component: UserComponent,
  props: (route) => {
    return { userId: route.params.id }
  }
})
```

This is obviously useful for assigning static values or route params down to your view components props but it also gives you

- Correct types on the route's params, query, etc.
- Correct type for return type.
- Support for async prop fetching.

## Params Type

The params passed to your callback has all of the type context including params from parents and any defaults applied.

## Return Type

Your callback will throw a Typescript error if it returns anything other than the type defined by the component for props. This also means that if your route's component has required props, you'll get an error until you satisfy this requirement.

## Async prop fetching

The props call back supports promises. This means you can do much more than just forward values from params or insert static values. For example, we can take an id route param and fetch the `User` before mounting the component.

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
  component: UserComponent,
  props: async (route) => {
    const user = await userStore.getById(route.params.id)

    return { user }
  })
})
```

## Context

The router provides a second `context` argument to your props callback. The context will always include: 

| Property | Description |
| ---- | ---- |
| push | Convenient way to move the user from wherever they were to a new route. |
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
  props: async (route, { reject }) => {
    try {
      const user = await userStore.getById(route.params.id)

      return { user }
    } catch (error) {
      reject('NotFound')
    }
  })
})
```