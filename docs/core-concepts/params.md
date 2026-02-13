# Params

Params are used to define the dynamic parts of a route. Params can be used in the `path`, `query`, `hash`, and `host` properties when defining a route.

## Param Names

Param names are defined using square brackets. What is inside the brackets is the name of the param and is used when accessing the param value and when providing the param value when navigating to the route.

```ts {3}
const events = createRoute({
  name: 'events',
  path: '/events/[year]/[month]',
})
```

:::warning
Param names must be unique. This includes all properties that have params as well as between a child route and it's parent route.
:::

## Optional Params

Params can be made optional by adding a `?` before the name. The `year` param is not optional and will have the type `string` when being accessed. But the `month` param is optional and will have the type `string | undefined` when being accessed.

```ts {3}
const events = createRoute({
  name: 'events',
  path: '/events/[year]/[?month]',
})
```

## Greedy Params

By default, a path param matches only up to the next `/` (a single path segment). For example, the path `/photos/[date]` matches `/photos/2026` (param is `"2026"`) but not `/photos/2026/01`.

A **greedy param** matches across one or more path segments (including `/`). Add a `*` after the param name: `[param*]` or `[?param*]`. The path `/photos/[date*]` then matches both `/photos/2026` (param is `"2026"`) and `/photos/2026/01` (param is `"2026/01`).

```ts {3}
const route = createRoute({
  name: 'photos',
  path: '/photos/[date*]',
})
```

Use greedy params when a param value can contain slashes (e.g. file paths or encoded segments).

## Param Types

By default all params are strings. However, using the `withParams` utility, you can assign different param types.

Now the `year` param must be a valid number. The router will not match the route if it is not a number, it will have the type `number` when being accessed, and the type `number` will be enforced when navigating and providing a value for the param. 

```ts {1,5-7}
import { withParams } from '@kitbag/router'

const events = createRoute({
  name: 'events',
  path: withParams('/events/[year]/[?month]', {
    year: Number,
  }),
})
```

:::info Route Matching
When using a param type, if the url cannot be parsed as the specified type it will not be matched. For example if the url was `/events/two-thousand-and-twenty-four/september` it would not be matched because `two-thousand-and-twenty-four` is not a number. See [route matching](/advanced-concepts/route-matching) for more information.
:::

### Built-in Param Types

Kitbag Router comes with a few built-in param types:

| Type     | Default | Description                                                                                   |
| -------- | ------- | --------------------------------------------------------------------------------------------- |
| `String` | ✓       | Any string value                                                                              |
| `Number` |         | Any value that can be parsed with the `Number` constructor                                    |
| `Boolean`|         | The literal values `"true"` or `"false"`                                                      |
| `Date`   |         | Any value that can be parsed with the `Date` constructor. Uses `toISOString` when serializing |
| `RegExp` |         | A literal regex expression                                                                    |
| `JSON`   |         | Any value that can be parsed with the `JSON.parse` method                                     |

## Custom Param Types

Define your own param types using the `createParam` utility.

This serves three purposes:

1. Define the type for the param in Typescript when accessing the param.
1. Define how the param should be serialized and deserialized.
1. Determine if a value is valid.

Using custom param types you can define more complex validation rules. For example, this month param must be a valid month name. If it is not, the route will not match.

```ts {3-11,17}
import { createParam, createRoute, withParams } from '@kitbag/router'

const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

const monthParam = createParam((value, { invalid }) => {
  if (months.includes(value)) {
    return value
  }

  throw invalid(`Invalid month: ${value}`)
})

const events = createRoute({
  name: 'events',
  path: withParams('/events/[year]/[?month]', {
    year: Number,
    month: monthParam,
  }),
})
```

By default custom params will use `toString` when serializing. But you can use a Get/Set param to define how the param should be serialized and deserialized. For example we can make the month param capitalized when parsing and lowercase when serializing.

```ts {2,8,17}
import { createParam } from '@kitbag/router'
import { capitalize } from '@/utilities'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const monthParam = createParam({
  get: (value, { invalid }) => {
    const month = capitalize(value)

    if (months.includes(month)) {
      return month
    }

    throw invalid(`Invalid month: ${month}`)
  },
  set: (value) => {
    return value.toLowerCase()
  },
})
```

## Default Values

Define a default value when creating a param or by using the `withDefault` utility. This value will be used when the param is not provided in the url. An optional param of type `String` will have the type `string | undefined` when being accessed. But when a default value is provided it will have the type `string`, even if the value is missing from the url.

```ts {7}
import { createRoute, withParams, withDefault } from '@kitbag/router'

const events = createRoute({
  name: 'events',
  path: withParams('/events/[year]/[?month]', {
    year: Number,
    month: withDefault(monthParam, 'january'),
  }),
})
```

## Query Params

So far the examples have only used params in the `path` property. When using params in the `query`, the param goes where you expect the value to be in the url's search string.

```ts {3}
const events = createRoute({
  name: 'events',
  query: 'category=[?category]',
})
```

The param name and the search key do not have to be the same. In this example the url search string might be `?category=hello`, which has a `term` param with the value `hello`.

```ts {2}
const events = createRoute({
  query: 'category=[?term]',
})
```

## Literal Types

Params can be defined as a literal value. This can be useful when an optional param can only have a single value when it is present.

```ts
import { withParams } from '@kitbag/router'

const events = createRoute({
  query: withParams('enabled=[?enabled]', {
    enabled: true,
  }),
})
```

Literal value params can be even more useful when coupled with utilities like [unionOf](/core-concepts/params#unions), [tupleOf](/core-concepts/params#tuples), [arrayOf](/core-concepts/params#arrays) which can very easily define more complex params.

## Unions

The `unionOf` utility can be used to define a param as a union of any number of [Param](/api/types/Param) arguments.

```ts
import { unionOf, withParams } from '@kitbag/router'

const events = createRoute({
  name: 'events',
  query: withParams('category=[?category]', {
    category: unionOf(['music', 'sports', 'art']),
  }),
})
```

## Arrays

The `arrayOf` utility can be used to define a param as an array of any number of [Param](/api/types/Param) arguments.

```ts
import { arrayOf withParams } from '@kitbag/router'

const events = createRoute({
  name: 'events',
  query: withParams('category=[?category]', {
    category: arrayOf(['music', 'sports', 'art']),
  }),
})
```

### Array Options

Optionally pass in options to specify a separator. The default separator is a comma.

```ts
arrayOf(['mustic', 'sports', 'art'], {
  separator: '|' 
})
```

## Tuples

The `tupleOf` utility can be used to define a param as a tuple of any number of [Param](/api/types/Param) arguments. Note the `tupleOf` utility also takes the same [options](/core-concepts/params#array-options) as the `arrayOf` utility.

```ts
import { tupleOf, withParams } from '@kitbag/router'

const events = createRoute({
  name: 'events',
  query: withParams('location=[?location]', {
    location: tupleOf([Number, Number]),
  }),
})
```

## Zod Param Types

[Zod](https://zod.dev/) schemas can be used as param types rather than defining a custom param type. Some zod schemas are not supported such as `z.promise`, `z.function`, and `z.intersection`, but most schemas are supported.

```ts
import { z } from 'zod'

const events = createRoute({
  name: 'events',
  query: query('category=[?category]', {
    category: z.enum(['music', 'sports', 'art']),
  }),
})
```

:::warning
Zod param types are experimental and may change or be removed in the future.
:::

## Valibot Param Types

[Valibot](https://valibot.dev/) schemas can be used as param types rather than defining a custom param type. Some zod schemas are not supported such as `v.promise`, `v.function`, and `v.intersection`, but most schemas are supported.

```ts
import * as v from 'valibot'

const events = createRoute({
  name: 'events',
  query: query('category=[?category]', {
    category: v.picklist(['music', 'sports', 'art']),
  }),
})
```

:::warning
Valibot param types are experimental and may change or be removed in the future.
:::
