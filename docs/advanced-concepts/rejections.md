# Rejections

Kitbag Router ships with built in support for rejection handling. Each rejection type you need is registered with a corresponding view, if rejections happen at any point in the router lifecycle the router will handle it.

## Rejection Component

When a rejection happens, Kitbag router mounts whatever component is registered for the type of rejection. Assign your rejection components wherever you call `createRouter`.

```ts
import { createRouter } from "@kitbag/router";
import MyNotFound from "@/components/MyNotFound.vue";
import MyAuthNeeded from "@/components/MyAuthNeeded.vue";

export const router = createRouter(routes, {
  rejections: {
    NotFound: MyNotFound,
  }
})
```

::: info Updating Registered Router
Be sure you've [updated the registered router](/getting-started#update-registered-router), this is ensures Typescript knows about your additional rejection types.
:::

## Rejection Type

By default the only registered rejection type is `NotFound`. Creating custom rejection types is as easy as defining them when you assign [rejection components](/advanced-concepts/rejections#rejection-component). For example, we can add a custom rejection for "AuthNeeded".

```ts
import { createRouter } from "@kitbag/router";
import MyNotFound from "@/components/MyNotFound.vue";
import MyAuthNeeded from "@/components/MyAuthNeeded.vue";

export const router = createRouter(routes, {
  rejections: {
    NotFound: MyNotFound,
    AuthNeeded: MyAuthNeeded, // [!code ++]
  }
})
```

## Trigger Rejection

Any of the [hooks](/advanced-concepts/hooks) will provided a `reject` function in the context argument.

```ts
const route = {
  ...
  onBeforeRouteEnter: (to, { reject }) => {
    reject('AuthNeeded')
  },
}
```

Alternatively, you can always trigger a rejection from `router.reject`.

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()

function maybeAuthNeeded() {
  ...
  router.reject('AuthNeeded')
}
```

### Get Rejection

Your rejection components have access to the current rejection with `useRejection`.

```ts
import { useRejection } from '@kitbag/router'

const rejection = useRejection()

const rejectionType = computed(() => rejection.value.type)
```
