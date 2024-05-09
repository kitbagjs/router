# path()

```ts
function path<TPath, TParams>(path, params): Path<TPath, TParams>
```

Constructs a Path object, which enables assigning types for params.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TPath` *extends* `string` | The string literal type that represents the path. |
| `TParams` *extends* `PathParams`\<`TPath`\> | The type of the path parameters associated with the path. |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `path` | `TPath` | The path string. |
| `params` | `Identity`\<`TParams`\> | The parameters associated with the path, typically as key-value pairs. |

## Returns

`Path`\<`TPath`, `TParams`\>

An object representing the path which includes the path string, its parameters,
         and a toString method for getting the path as a string.

## Example

```ts
import { createRoutes, path } from '@kitbag/router'

export const routes = createRoutes([
  {
    name: 'home',
    path: path('/:foo', { foo: Number }),
    component: Home
  },
])
```
