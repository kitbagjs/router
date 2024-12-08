# Functions: path()

```ts
function path<TPath, TParams>(value, params): Path<TPath, TParams>
```

Constructs a Path object, which enables assigning types for params.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TPath` *extends* `string` | The string literal type that represents the path. |
| `TParams` *extends* `PathParamsWithParamNameExtracted`\<`TPath`\> | The type of the path parameters associated with the path. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `TPath` | The path string. |
| `params` | `Identity`\<`TParams`\> | The parameters associated with the path, typically as key-value pairs. |

## Returns

`Path`\<`TPath`, `TParams`\>

An object representing the path which includes the path string, its parameters,
         and a toString method for getting the path as a string.

## Example

```ts
import { createRoute, path } from '@kitbag/router'

export const routes = createRoute({
  name: 'home',
  path: path('/[foo]', { foo: Number }),
  component: Home
})
```
