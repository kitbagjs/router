# Types: RouterReplace()\<TRoutes\>

```ts
type RouterReplace<TRoutes> = {
<TSource>  (name, ...args): Promise<void>;
  (route, options?): Promise<void>;
  (url, options?): Promise<void>;
};
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

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
| ...`args` | `RouterReplaceArgs`\<`TRoutes`, `TSource`\> |

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
| `options?` | [`RouterReplaceOptions`](RouterReplaceOptions.md)\<`unknown`\> |

### Returns

`Promise`\<`void`\>

## Call Signature

```ts
(url, options?): Promise<void>;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | [`UrlString`](UrlString.md) |
| `options?` | [`RouterReplaceOptions`](RouterReplaceOptions.md)\<`unknown`\> |

### Returns

`Promise`\<`void`\>
