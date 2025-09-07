# Functions: isWithComponentProps()

```ts
function isWithComponentProps<T>(options): options is T & { props: PropsGetter };
```

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `T` |

## Returns

`options is T & { props: PropsGetter }`
