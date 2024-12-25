# Router Route
The current route is represented by the "Router Route". See the [RouterRoute](/api/types/RouterRoute.md) type for more information.

The route can be accessed using the `useRoute` composable within your components. It is also available on the router instance as the `route` property.

```ts
import { useRoute } from '@kitbag/router'

const route = useRoute()
```