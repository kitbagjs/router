# query

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

An object representing the query which includes the query string, its parameters, and a toString method for getting the query as a string.

## Example

```ts
import { createRoutes, query } from '@kitbag/router'

export const routes = createRoutes([
  {
    name: 'home',
    query: query('bar=[bar]', { bar: Boolean }),
    component: Home
  },
])
```

## Custom Params

Param types is customizable with [`ParamGetter`](/api/types/ParamGetter), [`ParamSetter`](/api/types/ParamSetter), and [`ParamGetSet`](/api/types/ParamGetSet). Read more about [custom params](/core-concepts/route-params#custom-param).
