# useRoute

Returns the current route. See ['RouterRoute'](/api/types/RouterRoute) for more information.

```ts
import { useRoute } from '@kitbag/router'

const route = useRoute()
```

This composable can also be used to narrow the type of the route by passing in the name of the expected route. It works the same way as the [`isRoute`](/api/type-guards/isRoute.html) type guard. However if the current route does not match the expected route, a [`UseRouteInvalidRouteError`](/api/errors/UseRouteInvalidError.html) will be thrown.

```ts
const route = useRoute('profile')
```

The route will match as long as the name matches any of the matches in the current route. This includes any parent routes. To match a specific route, you can use the `exact` option.

```ts
const route = useRoute('profile', { exact: true })
```

:::tip
[Register](/quick-start.html#type-safety) your router to get the proper types when using this composable.
:::
