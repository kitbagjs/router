# Composables

## useRouter

Returns the router, with types provided by [the `Register` interface](/quick-start#update-registered-router).

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()
```

## useRoute

Returns the current route with built in type guard.

```ts
import { useRoute } from '@kitbag/router'

const route = useRoute('route.name.here')
```

the route name argument is what acts as a route guard, providing back the correct types for `params` and `update`. This route name argument is optional on `useRoute`, if omitted will return the same wider type as `Router.route`. If the name is provided it must match the current route name or a parent of the current route.

### Exact matches
If you'd like to only match on an exact route match and not match on a parent route you can pass the `exact` option.

```ts
const route = useRoute('route.name.here', { exact: true })
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
