# Route Params

When defining your route `path`, you can use a colon `:` to denote dynamic params.

```ts
import { 
  Routes,
} from 'kitbag/router'

const routes = [
  {
    name: 'users',
    path: '/users/:id',
    component: ...
  }
] as const satisfies Routes
```

This means the route will expect 1+ extra string characters (anything but a forward slash `/`) in order to be considered a match. The value of these extra characters is captured and exposed in the `route.params`

```ts
const route = useRoute()

route.params.id
```

When defined this way, these params are reactive strings. If you update a param, the url will be updated accordingly.

## Param Types

With the `path` function, kitbag/router supports mapping params to types other than `string`.

```ts
import { 
  Routes,
  path, // [!code ++]
} from 'kitbag/router'

const routes = [
  {
    name: 'users',
    path: '/users/:id', // [!code --]
    path: path('/users/:id', { id: Number }), // [!code ++]
    component: ...
  }
] as const satisfies Routes
```

This will automatically parse the param from `string` in the URL to `number` in `route.params`.

kitbag/router ships with support for `String` (default), `Boolean`, and `Number`. However, you can define whatever type mapping you desire with your own `ParamGetter` or `ParamGetSet`.

```ts
type ExpectedId = `A${number}`

// using simple type guard as example
function isExpectedId(value: string): value is ExpectedId {
  return /^A[0-9]$/.test(value)
}

const validIdParam: ParamGetter<ExpectedId> = (value, { invalid }) => {
  if (isExpectedId(value)) {
    // Return value is what will be provided in route.params.id
    return value
  }

  // If any exception is thrown, the route will not match. 
  // Use the provided `invalid` function to provide additional context to the router. 
  throw invalid('Value does not follow expected id format')
}
```

Update your param assignment on the route's path

```ts
const routes = [
  {
    name: 'users',
    path: path('/users/:id', { id: validIdParam }), // [!code focus]
    component: ...
  }
] as const satisfies Routes
```

With this getter defined, now our route will only match if the param matches our rules above.

As a `ParamGetter`, the value in `route.params` is readonly. Alternatively if you use `ParamGetSet`, the value will be writable as well.

```ts
const validIdParam: ParamGetSet<ExpectedId> = {
  get: (value, { invalid }) => {
    if (isExpectedId(value)) {
      return value
    }

    throw invalid()
  },
  set: (value, { invalid }) => {
    if (isExpectedId(value)) {
      return value
    }

    throw invalid()
  },
}
```

## Optional Params

If you define your path params with a question mark, `:?` the router assumes this param is not required.

```ts
const routes = [
  {
    name: 'users',
    path: '/users/:?id', // [!code focus]
    component: ...
  }
] as const satisfies Routes
```

This means the route will match even if nothing is provided after `/users/`.

This also works for non-string params.

```ts
const routes = [
  {
    name: 'users',
    path: path('/users/:?id', { id: Number }), // [!code focus]
    component: ...
  }
] as const satisfies Routes
```

Which now, `router.params.id` has the type `number | undefined`, and will only match url where the value passes as a number or is missing entirely.
