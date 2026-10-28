# useParam

Read values from the current route by their shared [param definition](/core-concepts/params#looking-up-param-definitions), without knowing their names on the route. `useParam` returns readonly computed refs that update when the current route changes.

## Basic usage

Create a reusable param definition and export it for both the route and its components:

```ts
// params.ts
import { createParam } from '@kitbag/router'

export const userId = createParam(Number)
```

Use the definition when declaring a route param:

```ts
// routes.ts
import { createRoute, withParams } from '@kitbag/router'
import { userId } from './params'

export const user = createRoute({
  name: 'user',
  path: withParams('/users/[id]', { id: userId }),
})
```

Pass the same definition to `useParam` inside a component's setup. For `/users/123`, `id.value` is `123` and has the type `number | undefined`:

```vue
<script setup lang="ts">
import { useParam } from '@kitbag/router'
import { userId } from './params'

const { value: id } = useParam(userId)
</script>

<template>
  <p v-if="id !== undefined">User {{ id }}</p>
</template>
```

## Multiple values

When a definition is used more than once, `value` contains the first present value and `values` contains all present values. Values follow host, path, query, then hash order. For example, share a definition between two path params:

```ts
const users = createRoute({
  name: 'users',
  path: withParams('/users/[from]/[to]', {
    from: userId,
    to: userId,
  }),
})
```

For `/users/1/2`, the component reads both values:

```ts
const { value, values } = useParam(userId)

value.value // 1, typed as number | undefined
values.value // [1, 2], typed as number[]
```

## Missing values and defaults

If the current route has no present values for the definition, `value` is `undefined` and `values` is an empty array. Absent optional params are skipped. Default values are included when the route param has a default.

Lookup matches the definition's identity. Reuse the same definition wherever you want values to match; separate `createParam(Number)` calls do not match each other. `withDefault` preserves an existing definition's identity.

To read values in a route callback or from a resolved route, use [`getParam` and `getAllParams`](/core-concepts/params#looking-up-param-definitions).
