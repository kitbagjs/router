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

You're not limited to the param types that ship with Kitbag Router, use `ParamGetter<T>` or `ParamGetSet<T>` to parse params to whatever type you need. For example, here is the ParamGetter Kitbag Router defines for Number params.

```ts
const numberParam: ParamGetter<number> = (value, { invalid }) => {
  const number = Number(value)

  if (isNaN(number)) {
    // If any exception is thrown, the route will not match.
    // Use the provided `invalid` function to provide additional context to the router.
    throw invalid()
  }

  // Return value is what will be provided in route.params.id
  return number
}
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

As a `ParamGetter`, the value in `route.params` is still writable, but the set will assume `value.toString()` is sufficient. Alternatively if you use `ParamGetSet`, you can provide the same validation on value set as well.

```ts
const numberParam: ParamGetSet<number> = {
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
}
```

## Optional Params

If you define your path params with a question mark, `:?` the router assumes this param is not required.

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
    query: 'sortBy=[id]'
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
