# Rejections

Kitbag Router ships with built in support for rejection handling. Each rejection type you need is registered with a corresponding view, if rejections happen at any point in the router lifecycle the router will handle it.

## Rejection Type

By default the only registered rejection type is `NotFound`, however you can extend this to include anything you wish. For example, if we want to add a rejection type for `AuthNeeded` we can simply extend the rejections defined in the `Register` interface.

```ts
declare module '@kitbag/router' {
  interface Register {
    // router: typeof router
    rejections: ['AuthNeeded']
  }
}
```

## Rejection Component

When a rejection happens, Kitbag router mounts whatever component is registered for the type of rejection. Assign your rejection components wherever you call `createRouter`.

```ts
import { createRoutes } from "@kitbag/router";
import MyNotFound from "@/components/MyNotFound.vue";
import MyAuthNeeded from "@/components/MyAuthNeeded.vue";

export const router = createRouter(routes, {
  rejections: {
    NotFound: MyNotFound,
    AuthNeeded: MyAuthNeeded,
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
