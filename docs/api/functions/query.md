# query()

```ts
function query<TQuery, TParams>(query, params): Query<TQuery, TParams>
```

Constructs a Query object, which enables assigning types for params.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TQuery` *extends* `string` | The string literal type that represents the query. |
| `TParams` *extends* `QueryParams`\<`TQuery`\> | The type of the query parameters associated with the query. |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `query` | `TQuery` | The query string. |
| `params` | `Identity`\<`TParams`\> | The parameters associated with the query, typically as key-value pairs. |

## Returns

`Query`\<`TQuery`, `TParams`\>

An object representing the query which includes the query string, its parameters,
         and a toString method for getting the query as a string.

## Example

```ts
import { createRoutes, query } from '@kitbag/router'

export const routes = createRoutes([
  {
    name: 'home',
    query: query('?bar=:bar', { bar: Boolean }),
    component: Home
  },
])
```
