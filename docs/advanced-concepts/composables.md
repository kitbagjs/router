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

## useLink

Returns the functionality used by RouterLink to generate links and assign classes based on if route is currently active.

```ts
import { useLink } from '@kitbag/router'

const {
  // the resolved route object ref
  route,
  // the href string ref
  href,
  // boolean ref, true when route matches current URL or is ancestor route that matches current URL.
  isActive,
  // boolean ref, true when route matches current URL.
  isExactActive,
  // triggers `router.push` with context provided
  push,
  // triggers `router.replace` with context provided
  replace
} = useLink('my-route', { foo: 'bar' })
```

The `useLink` composable can also be provided a URL for `source` argument. Any of the arguments for `useLink` can be reactive.

```ts
const url = ref('/settings')

const { ... } = useLink(url)
```
