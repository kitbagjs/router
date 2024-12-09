# Functions: query()

```ts
function query<TQuery, TParams>(value, params): Query<TQuery, TParams>
```

Constructs a Query object, which enables assigning types for params.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TQuery` *extends* `string` | The string literal type that represents the query. |
| `TParams` *extends* `QueryParamsWithParamNameExtracted`\<`TQuery`\> | The type of the query parameters associated with the query. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `TQuery` | The query string. |
| `params` | `Identity`\<`TParams`\> | The parameters associated with the query, typically as key-value pairs. |

## Returns

`Query`\<`TQuery`, `TParams`\>

An object representing the query which includes the query string, its parameters,
         and a toString method for getting the query as a string.

## Example

```ts
import { createRoute, query } from '@kitbag/router'

export const routes = createRoute({
  name: 'home',
  query: query('bar=[bar]', { bar: Boolean }),
  component: Home
})
```
