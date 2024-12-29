# Params
Params are used to define the dynamic parts of a route. Params can be used in the `path`, `query`, and `host` properties when defining a route.

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

## Param Types
By default all params are strings. But you can define a specific type for a param by using the `path` or `query` utilities. Now the `year` param will have the type `number` when being accessed.

```ts {1,5-7}
import { path } from '@kitbag/router'

const events = createRoute({
  name: 'events',
  path: path('/events/[year]/[?month]', {
    year: Number,
  }),
})
```

:::info Route Matching
When using a param type, if the url cannot be parsed as the specified type it will not be matched. For example if the url was `/events/two-thousand-and-twenty-four/september` it would not be matched because `two-thousand-and-twenty-four` is not a number.
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
You can define your own param types using the `createParam` utility. This serves three purposes:
1. Define the type of the param.
2. Define how the param should be serialized and deserialized.
3. Determine if a value is valid.

Using custom param types you can define more complex validation rules. For example, this month param must be a valid month name. If it is not, the route will not match.

```ts {3-11,17}
import { createParam, createRoute, path } from '@kitbag/router'

const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const

const monthParam = createParam((value, { invalid }) => {
  if (months.includes(value as any)) {
    return value
  }

  invalid(`Invalid month: ${value}`)
})

const events = createRoute({
  name: 'events',
  path: path('/events/[year]/[?month]', {
    year: Number,
    month: monthParam,
  }),
})
```

By default custom params will use `toString` when serializing. But you can use a Get/Set param to define how the param should be serialized and deserialized. For example we can make the month param capitalized when parsing and lowercase when serializing.

```ts
import { createParam } from '@kitbag/router'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const

const monthParam = createParam({
  get: (value, { invalid }) => {
    const month = value.charAt(0).toUpperCase() + value.slice(1)

    if (months.includes(month as any)) {
      return month
    }

    invalid(`Invalid month: ${month}`)
  },
  set: (value) => {
    return value.toLowerCase()
  },
})
```

## Default Values
You can define a default value for a param type when creating it. This value will be used when the param is optional and not provided in the url. An optional param of type `String` will have the type `string | undefined` when being accessed. But when a default value is provided it will have the type `string`, even if the value is missing from the url.

```ts {8}
const monthParam = createParam({
  get: (value, { invalid }) => {
    ...
  },
  set: (value) => {
    ...
  },
  defaultValue: 'january',
})
```

You can also define a default value for a individual param using the `withDefault` utility.

```ts {7}
import { createRoute, path, withDefault } from '@kitbag/router'

const events = createRoute({
  name: 'events',
  path: path('/events/[year]/[?month]', {
    year: Number,
    month: withDefault(monthParam, 'january'),
  }),
})
```

Or create a new param type with a default value from an existing param type.

```ts {7}
import { createParam, withDefault } from '@kitbag/router'

const monthParam = createParam((value, { invalid }) => {
  ...
})

const monthParamWithDefault = withDefault(monthParam, 'january')
```

## Query Params
So far we have only looked at params in the `path` property. But params can also be used in the `query` property. When using params in the `query` the param goes where you expect the value to be in the url's search string.

```ts {3}
const events = createRoute({
  name: 'events',
  query: 'highlight=[?highlight]',
})
```

The param name and the search key do not have to be the same. In this example the url search string would like like `?highlight=hello` and the param would have the value `hello`. But the param's name is `term`. 

```ts {2}
const events = createRoute({
  query: 'highlight=[?term]',
})
```
