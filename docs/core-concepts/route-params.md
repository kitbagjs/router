# Route Params

When defining your route `path` and `query`, you can wrap part in square brackets `[]` to denote dynamic params.

```ts
import { createRoutes } from '@kitbag/router'

const routes = createRoutes([
  {
    name: 'users',
    path: '/users/[id]',
    component: ...
  }
])
```

This means the route will expect 1+ extra string characters in order to be considered a match. This value can be anything, including forward slashes `/`. The value of these extra characters is captured and exposed in the `route.params`.

```ts
const route = useRoute()

route.params.id
```

When defined this way, these params are reactive strings. If you update a param, the URL will be updated accordingly.

## Param Types

With the `path` function, Kitbag Router supports parsing params to types other than `string`.

```ts
import { 
  createRoutes,
  path, // [!code ++]
} from '@kitbag/router'

const routes = createRoutes([
  {
    name: 'users',
    path: '/users/[id]', // [!code --]
    path: path('/users/[id]', { id: Number }), // [!code ++]
    component: ...
  }
])
```

This will automatically parse the param from `string` in the URL to `number` in `route.params`. If the value cannot be parsed, the route will not be considered a match.

Kitbag Router ships with support for `String` (default), `Boolean`, `Number`, `Date`, `JSON`, and `RegExp`.

### RegExp Params

Using native RegExp is a powerful way of controlling route matching.

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: path('/users/[id]', { id: /^A[0-9]$/  }), // [!code focus]
    component: ...
  }
])
```

### Custom Param

You're not limited to the param types that ship with Kitbag Router, use the `createParam` utility to parse params to whatever type you need. For example, here is the param Kitbag Router defines for Number params.

```ts
import { createParam } from '@kitbag/router'

const numberParam = createParam((value, { invalid }) => {
  const number = Number(value)

  if (isNaN(number)) {
    // If any exception is thrown, the route will not match.
    // Use the provided `invalid` function to provide additional context to the router.
    throw invalid()
  }

  // Return value is what will be provided in route.params.id
  return number
})
```

Update your param assignment on the route's path

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: path('/users/[id]', { id: numberParam }), // [!code focus]
    component: ...
  }
])
```

With this getter defined, now our route will only match if the param matches our rules above.

If you only supply a getter for your param it will assume that `value.toString()` is sufficient when setting the value. Alternatively you can supply both a `get` and a `set` method and provide validation on the value when setting as well.

```ts
const numberParam = createParam({
  get: (value, { invalid }) => {
    const number = Number(value)

    if (isNaN(number)) {
      throw invalid()
    }

    return number
  },
  set: (value, { invalid }) => {
    if (typeof value !== 'number') {
      // If any exception is thrown, the route will not match.
      // Use the provided `invalid` function to provide additional context to the router.
      throw invalid()
    }

    // Return value is what will be provided in route.params.id
    return value.toString()
  },
})
```

## Optional Params

If you define your path params with a question mark, `?` the router assumes this param is not required.

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: '/users/[?id]', // [!code focus]
    component: ...
  }
])
```

This means the route will match even if nothing is provided after `/users/`.

This also works for non-string params.

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: path('/users/[?id]', { id: Number }), // [!code focus]
    component: ...
  }
])
```

Which now, `router.params.id` has the type `number | undefined`, and will only match URL where the value passes as a number or is missing entirely.

## Default Value

Often times when a param is optional, we want to assign a value to use as the default.

```ts
import { createRoutes, useRoute } from '@kitbag/router'

const routes = createRoutes([
  {
    name: 'users',
    path: '/users',
    query: 'sort-by=[?sort]'
  }
])

const route = useRoute('users')
const sort = computed(() => route.params.sort ?? 'asc')
```

With Kitbag Router we can configure this on the route or within custom params.

```ts
import { withDefault } from '@kitbag/router'

const sortParam = withDefault(String, 'asc')
```

The `withDefault` utility accepts any param, including custom params and returns a custom param that can be used just like any other custom param.

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: '/users',
    query: query('sort-by=[?sort]', { sort: sortParam })// [!code focus]
  }
])
```

You can also assign a default value with the 2nd argument of `createParam`.

```ts
const sortParam = createParam({
  get: (value, { invalid }) => {
    if (value !== 'asc' && value !== 'desc') {
      throw invalid()
    }

    return value
  },
  set: (value) => {
    return value.toString()
  },
}, 'asc') // [!code focus]
```

Params with a default value will remain optional when navigating.

```ts
const router = useRouter()

router.push('users') // -> /users
router.push('users', { sort: 'desc' }) // -> /users?sort=desc
```

However, the type when accessing the param will **not** be optional. Even if the value is not in the URL, your components can expect a value to be assigned.

```ts
const route = useRoute('users')

route.params.sort // -> 'asc' | 'desc'
```

## Param Name

There are no constraints on the name you choose for param names

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: '/users/[can-have#what.ever/you/want!?]',
    component: ...
  }
])
```

Keep in mind that any special characters in the param name will make accessing the value slightly less pretty.

```ts
const route = useRoute()

route.params['can-have#what.ever/you/want!?']
```

Also, route names that start with a question mark `?` are interpreted as optional params.

Param names must be unique. This includes params defined in a path parent and params defined in the query.

```ts
// invalid
const routes = createRoutes([
  {
    name: 'users',
    path: '/users/[id]',
    query: 'sort-by=[id]'
  }
])

// invalid
const routes = createRoutes([
  {
    name: 'users',
    path: '/users/[id]',
    children: createRoutes([
      name: 'tokens',
      path: '/tokens/[id]',
      component: ...
    ])
  }
])
```
