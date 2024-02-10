# Query Params

Kitbag/router has first class support for query params.

```ts
const routes = [
  {
    name: 'users',
    path: '/users',
    query: 'sort=descending',
    component: ...
  }
] as const satisfies Routes
```

This static value will be used in determining if a route matches a given URL. Unlike `path`, the order of params is not enforced and the presence of extra query params in the URL does not preclude the route from being considered a match.

The router supports dynamic params declared in the query as well.

```ts
import { 
  Routes,
} from 'kitbag/router'

const routes = [
  {
    name: 'users',
    path: '/users',
    query: 'sort=:sort',
    component: ...
  }
] as const satisfies Routes
```

Just like params declared in `path`, these values will be found in the `route.params`.

```ts
const route = useRoute()

route.params.sort
```

## Param Types

Again like params declared in `path`, these params default as writable `string`, but can be overridden with built in `Number`, `Boolean`, `RegExp`, or any `ParamGetter`/`ParamGetSet` you define.

```ts
import { 
  Routes,
  query, // [!code ++]
} from 'kitbag/router'

const routes = [
  {
    name: 'users',
    path: '/users',
    query: 'sort=:sort',// [!code --]
    query: query('sort=:sort', { sort: Number }),// [!code ++]
    component: ...
  }
] as const satisfies Routes
```

## Optional Params

Add a question mark `:?` to your query param to make it optional.

```ts
const routes = [
  {
    name: 'users',
    path: '/users',
    query: 'sort=:?sort',// [!code focus]
    component: ...
  }
] as const satisfies Routes
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
