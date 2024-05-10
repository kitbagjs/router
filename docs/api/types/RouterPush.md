# RouterPush

Push will update the URL for the browser and also add the URL into the history so when a user uses the back button on their browser it will behave as expected.

## Type parameters

| Parameter | Type |
| :------ | :------ |
| `TSource` | [`Key`](/api/types/Route#key) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `source` | [`Url`](/api/types/Url) \| `TSource` |
| `options` | [`RouterPushOptions`](/api/types/RouterPush#routerpushoptions) \| `undefined` |

### RouterPushOptions

```ts
{
  query?: Record<string, string>,
  replace?: boolean,
}
```

## Returns

`Promise<void>`
