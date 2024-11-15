# RouterReplace

Replace has the same effect as [`RouterPush`](/api/types/RouterPush) but without pushing an entry to the browser's history.

## Type parameters

| Parameter | Type |
| :------ | :------ |
| `TSource` | [`Name`](/api/types/Route#name) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `source` | [`Url`](/api/types/Url) \| `TSource` |
| `options` | [`RouterReplaceOptions`](/api/types/RouterReplace#routerreplaceoptions) \| `undefined` |

### RouterReplaceOptions

```ts
{
  query?: ConstructorParameters<typeof URLSearchParams>[0],
  hash?: string,
}
```

## Returns

`Promise<void>`
