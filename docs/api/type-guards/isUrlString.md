# Type Guards: isUrlString()

```ts
function isUrlString(value): value is UrlString;
```

A type guard for determining if a value is a valid URL.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to check. |

## Returns

`value is UrlString`

`true` if the value is a valid URL, otherwise `false`.
