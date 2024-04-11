# Query Params

Kitbag Router has first class support for query params.

```ts
import { createRoutes } from '@kitbag/router'

const routes = createRoutes([
  {
    name: 'users',
    path: '/users',
    query: 'sort=descending',
    component: ...
  }
])
```

This static value will be used in determining if a route matches a given URL. Unlike `path`, the order of params is not enforced and the presence of extra query params in the URL does not preclude the route from being considered a match.

The router supports dynamic params declared in the query as well.

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: '/users',
    query: 'sort=:sort',
    component: ...
  }
])
```

Just like params declared in `path`, these values will be found in the `route.params`.

```ts
import { useRoute } from '@kitbag/router'

const route = useRoute()

route.params.sort
```

## Param Types

Again like params declared in `path`, these params default as writable `string`, but can be overridden with built in `Number`, `Boolean`, `RegExp`, or any `ParamGetter`/`ParamGetSet` you define.

```ts
import { 
  createRoutes,
  query, // [!code ++]
} from '@kitbag/router'

const routes = createRoutes([
  {
    name: 'users',
    path: '/users',
    query: 'sort=:sort',// [!code --]
    query: query('sort=:sort', { sort: Number }),// [!code ++]
    component: ...
  }
])
```

## Optional Params

Add a question mark `:?` to your query param to make it optional.

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: '/users',
    query: 'sort=:?sort',// [!code focus]
    component: ...
  }
])
```

## Unnamed Query Params

The entire query is also available in `route.query`. This includes any named query params but with their raw value.

### Query Param Naming

The name you provide for the param does not have to match the key from the URL. `query: 'keySort=:paramSort'`.

```ts
const route = useRoute()

route.params.paramSort
route.params.query.keySort
```

As for the param name, query params follow the same rules as [path params](/core-concepts/route-params#param-name)
