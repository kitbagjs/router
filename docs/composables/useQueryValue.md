# useQueryValue

Returns the value of a specific key in the query string. The query can be accessed using the Router Route's [query property](/api/types/RouterRoute#query) but this composable allows using [param types](/core-concepts/params#param-types) to ensure type safety. This is useful when you need to interact with the query but without defining a [query param](/core-concepts/params#query-params).

## Arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `MaybeRefOrGetter<string>` | Yes | The query parameter key to get/set values for. Can be a string, ref, or computed value |
| `param` | `Param` | No | The parameter type to use for type conversion. Defaults to `String`. See [param types](/core-concepts/params#param-types) for available options |

## Return Type

| Property | Type | Description |
|----------|------|-------------|
| `value` | `Ref<T \| null>` | The single value for the query parameter |
| `values` | `Ref<T[]>` | All values for the query parameter as an array |
| `remove` | `() => void` | Function to remove the query parameter |

Where `T` is the type determined by the param type (defaults to `string`).

## Basic Usage

```ts
import { useQueryValue } from '@kitbag/router'

const { value: userId } = useQueryValue('userId')
//              ^? Ref<string | null>

const { values: userIds } = useQueryValue('selectedUserIds')
//              ^? Ref<string[]>
```

## Param Types

The param type can be passed in to ensure the type of the value is correct.

```ts
const { value: userId } = useQueryValue('userId', Number)
//              ^? Ref<number | null>

const { values: userIds } = useQueryValue('selectedUserIds', Number)
//              ^? Ref<number[]>
```
