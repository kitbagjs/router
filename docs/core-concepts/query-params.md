# Query Params

Kitbag Router lets you define your query just like the path.

```ts
import { createRoute } from '@kitbag/router'

const users = createRoute({
  name: 'users',
  path: '/users',
  query: 'sort=descending',
  component: ...
})
```

This static value will be used in determining if a route matches a given URL. Unlike `path`, the order of params is not enforced and the presence of extra query params in the URL does not preclude the route from being considered a match.

## Route Params

The query was also built to support all of the same [route params](/core-concepts/route-params) benefits as path.

```ts
import { createRoute } from '@kitbag/router'

const users = createRoute({
  name: 'users',
  path: '/users',
  query: 'sort=[sort]',
  component: ...
})
```

Kitbag router exports a `query` function, which offers support for changing param types in the query just like [path](/core-concepts/route-params#param-types).

```ts
import { 
  createRoute,
  query, // [!code ++]
} from '@kitbag/router'

const users = createRoute({
  name: 'users',
  path: '/users'
  query: 'sort=[sort]', // [!code --]
  query: query('sort=[sort]', { sort: Number }), // [!code ++]
  component: ...
})
```

Like params declared in `path`, these values will be found in the `route.params`.

```ts
import { useRoute } from '@kitbag/router'

const route = useRoute()

route.params.sort
```

## Unnamed Query Params

The entire query is also available in `route.query`. This includes any named query params but with their raw value.

## Query Param Naming

The name you provide for the param does not have to match the key from the URL. `query: 'nameInUrl=[nameInParams]'`.

```ts
const route = useRoute()

route.params.nameInParams // Kitbag router param
route.query.nameInUrl // native URL search param
```

As for the param name, query params follow the same rules as [route params](/core-concepts/route-params#param-name)
