# Composables

## useRoute

Returns the current route with built in type guard.

```ts
import { useRoute } from '@kitbag/router'

const route = useRoute('route.key.here')
```

the route key argument is what acts as a route guard, providing back the correct types for `params` and `update`. This route key argument is optional on `useRoute`, if omitted will return the same wider type as `Router.route`. The key must match the current route, otherwise router will throw an error.

## useRouter

Returns the installed router, with types provided by [the `Register` interface](/getting-started#update-registered-router).

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()
```

## hooks

All of the hooks are available as composables, with the exception of `onBeforeRouteEnter`

- onBeforeRouteUpdate
- onBeforeRouteLeave
- onAfterRouteLeave
- onAfterRouteUpdate
- onAfterRouteEnter
