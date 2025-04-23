# Type Guards: isUrl()

```ts
function isUrl(value): value is Url;
```

A type guard for determining if a value is a valid URL.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to check. |

## Returns

`value is Url`

`true` if the value is a valid URL, otherwise `false`.
