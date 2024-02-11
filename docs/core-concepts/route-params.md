# Route Params

When defining your route `path`, you can use a colon `:` to denote dynamic params.

```ts
import { 
  Routes,
} from '@kitbag/router'

const routes = [
  {
    name: 'users',
    path: '/users/:id',
    component: ...
  }
] as const satisfies Routes
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
  Routes,
  path, // [!code ++]
} from '@kitbag/router'

const routes = [
  {
    name: 'users',
    path: '/users/:id', // [!code --]
    path: path('/users/:id', { id: Number }), // [!code ++]
    component: ...
  }
] as const satisfies Routes
```

This will automatically parse the param from `string` in the URL to `number` in `route.params`. If the value cannot be parsed, the route will not be considered a match.

Kitbag Router ships with support for `String` (default), `Boolean`, `Number`, and `RegExp`.

### RegExp Params

Using native RegExp is a powerful way of controlling route matching.

```ts
const routes = [
  {
    name: 'users',
    path: path('/users/:id', { id: /^A[0-9]$/  }), // [!code focus]
    component: ...
  }
] as const satisfies Routes
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
const routes = [
  {
    name: 'users',
    path: path('/users/:id', { id: idFormatParam }), // [!code focus]
    component: ...
  }
] as const satisfies Routes
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
