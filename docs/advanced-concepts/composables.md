# Composables

## useRoute

Returns the current route with built in type guard.

```ts
import { useRoute } from '@kitbag/router'

const route = useRoute('route.key.here')
```

the route key argument is what acts as a route guard, providing back the correct types for `params` and `update`. This route key argument is optional on `useRoute`, if omitted will return the same wider type as `Router.route`. If the key is provided it must match the current route key or a parent of the current route.

## useRouter

Returns the router, with types provided by [the `Register` interface](/getting-started#update-registered-router).

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()
```
