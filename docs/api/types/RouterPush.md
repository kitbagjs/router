# RouterPush

Push will update the URL for the browser and also add the URL into the history so when a user uses the back button on their browser it will behave as expected.

## Type parameters

| Parameter | Type |
| :------ | :------ |
| `TSource` | [`Name`](/api/types/Route#name) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `source` | [`Url`](/api/types/Url) \| `TSource` |
| `options` | [`RouterPushOptions`](/api/types/RouterPush#routerpushoptions) \| `undefined` |

### RouterPushOptions

```ts
{
  query?: QuerySource,
  replace?: boolean,
  hash?: string,
}
```

[QuerySource](/api/types/QuerySource)

## Returns

`Promise<void>`
