# Types: RouterPush()\<TRoutes\>

```ts
type RouterPush<TRoutes> = {
<TSource>  (name, ...args): Promise<void>;
  (route, options?): Promise<void>;
  (url, options?): Promise<void>;
};
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | `any` |

## Call Signature

```ts
<TSource>(name, ...args): Promise<void>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TSource` *extends* `string` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `TSource` |
| ...`args` | `RouterPushArgs`\<`TRoutes`, `TSource`\> |

### Returns

`Promise`\<`void`\>

## Call Signature

```ts
(route, options?): Promise<void>;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | [`ResolvedRoute`](ResolvedRoute.md) |
| `options?` | [`RouterPushOptions`](RouterPushOptions.md)\<`unknown`\> |

### Returns

`Promise`\<`void`\>

## Call Signature

```ts
(url, options?): Promise<void>;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | [`Url`](Url.md) |
| `options?` | [`RouterPushOptions`](RouterPushOptions.md)\<`unknown`\> |

### Returns

`Promise`\<`void`\>
