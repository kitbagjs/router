# Route Params

When defining your route `path`, you can use a colon `:` to denote dynamic params.

```ts
import { createRoutes } from '@kitbag/router'

const routes = createRoutes([
  {
    name: 'users',
    path: '/users/:id',
    component: ...
  }
])
```

This means the route will expect 1+ extra string characters in order to be considered a match. This value can be anything, including forward slashes `/`. The value of these extra characters is captured and exposed in the `route.params`

```ts
const route = useRoute()

route.params.id
```

When defined this way, these params are reactive strings. If you update a param, the url will be updated accordingly.

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
    path: '/users/:id', // [!code --]
    path: path('/users/:id', { id: Number }), // [!code ++]
    component: ...
  }
])
```

This will automatically parse the param from `string` in the URL to `number` in `route.params`. If the value cannot be parsed, the route will not be considered a match.

Kitbag Router ships with support for `String` (default), `Boolean`, `Number`, and `RegExp`.

### RegExp Params

Using native RegExp is a powerful way of controlling route matching.

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: path('/users/:id', { id: /^A[0-9]$/  }), // [!code focus]
    component: ...
  }
])
```

### Custom Param

You're not limited to the param types that ship with Kitbag Router, use `ParamGetter<T>` or `ParamGetSet<T>` to parse params to whatever type you need.

```ts
type IdFormat = `${number}-${number}`

const idFormatParam: ParamGetter<IdFormat> = (value, { invalid }) => {
  const [versionString, subversionString] = value.split('-')
  const version = parseInt(versionString)
  const subversion = parseInt(subversionString)

  if (isNaN(version) || isNaN(subversion)) {
    // If any exception is thrown, the route will not match.
    // Use the provided `invalid` function to provide additional context to the router.
    throw invalid('Value provided for version is not valid integer')
  }

  // Return value is what will be provided in route.params.id
  return `${version}-${subversion}`
}
```

Update your param assignment on the route's path

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: path('/users/:id', { id: idFormatParam }), // [!code focus]
    component: ...
  }
])
```

With this getter defined, now our route will only match if the param matches our rules above.

As a `ParamGetter`, the value in `route.params` is still writable, but the set will assume `value.toString()` is sufficient. Alternatively if you use `ParamGetSet`, you can provide the same validation on value set as well.

```ts
// pulling out logic into simple type guard
function isValidIdFormat(value: string): value is IdFormat {
  const [versionString, subversionString] = value.split('-')
  const version = parseInt(versionString)
  const subversion = parseInt(subversionString)

  return !isNaN(version) && !isNaN(subversion)
}

const idFormatParam: ParamGetSet<IdFormat> = {
  get: (value, { invalid }) => {
    if (isValidIdFormat(value)) {
      return value
    }

    throw invalid()
  },
  set: (value, { invalid }) => {
    if (isValidIdFormat(value)) {
      return value
    }

    throw invalid()
  },
}
```

## Optional Params

If you define your path params with a question mark, `:?` the router assumes this param is not required.

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: '/users/:?id', // [!code focus]
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
    path: path('/users/:?id', { id: Number }), // [!code focus]
    component: ...
  }
])
```

Which now, `router.params.id` has the type `number | undefined`, and will only match url where the value passes as a number or is missing entirely.

## Param Name

There are very few constraints on the name you choose for a param. Your param name can include any special character except forward slash `/`. Kitbag Router uses forward slash (or the end of the string) to denote the end of a param name in a path.

```ts
const routes = createRoutes([
  {
    name: 'users',
    path: '/users/:can-have#what.ever!?',
    component: ...
  }
])
```

Keep in mind that any special characters in the param name will make accessing the value slightly less pretty.

```ts
const route = useRoute()

route.params['can-have#what.ever!?']
```

If your param name starts with a question mark `?`, Router will assume your param was intended to be optional.

```ts
// single param (name "id") which has type string | undefined
const routes = createRoutes([
  {
    name: 'users',
    path: '/users/:?id',
    component: ...
  }
])
```

The other important constraint is that param names must be unique. This includes params defined in a path parent and params defined in the query.

```ts
// invalid
const routes = createRoutes([
  {
    name: 'users',
    path: '/users/:id',
    query: 'sortBy=:id'
  }
])

// invalid
const routes = createRoutes([
  {
    name: 'users',
    path: '/users/:id',
    children: createRoutes([
      name: 'tokens',
      path: '/tokens/:id',
      component: ...
    ])
  }
])
```
