# Compositions: useLink()

```ts
const useLink: {
<TRouteKey>  (name, params?, options?): UseLink;
  (url, options?): UseLink;
  (resolvedRoute, options?): UseLink;
  (source, paramsOrOptions?, maybeOptions?): UseLink;
};
```

A composition to export much of the functionality that drives RouterLink component.
Also exports some useful context about routes relationship to current URL and convenience methods
for navigating.

## Call Signature

```ts
<TRouteKey>(
   name, 
   params?, 
   options?): UseLink;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRouteKey` *extends* `unknown` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `MaybeRefOrGetter`\<`TRouteKey`\> |
| `params?` | `MaybeRefOrGetter`\< \| `Record`\<`string`, `unknown`\> \| \{ [`x`: `string`]: `unknown`; [`x`: `number`]: `unknown`; [`x`: `symbol`]: `unknown`; \}\> |
| `options?` | `MaybeRefOrGetter`\<[`UseLinkOptions`](../types/UseLinkOptions.md)\> |

### Returns

[`UseLink`](../types/UseLink.md)

## Call Signature

```ts
(url, options?): UseLink;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `MaybeRefOrGetter`\<[`Url`](../types/Url.md)\> |
| `options?` | `MaybeRefOrGetter`\<[`UseLinkOptions`](../types/UseLinkOptions.md)\> |

### Returns

[`UseLink`](../types/UseLink.md)

## Call Signature

```ts
(resolvedRoute, options?): UseLink;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `resolvedRoute` | `MaybeRefOrGetter`\< \| `undefined` \| `Readonly`\<\{ `hash`: `string`; `href`: [`Url`](../types/Url.md); `id`: `TRoute`\[`"id"`\]; `matched`: `TRoute`\[`"matched"`\]; `matches`: `TRoute`\[`"matches"`\]; `name`: `TRoute`\[`"name"`\]; `params`: `ExtractRouteParamTypesReading`\<`TRoute`\>; `query`: `URLSearchParams`; `state`: `ExtractRouteStateParamsAsOptional`\<`TRoute`\[`"state"`\]\>; \}\>\> |
| `options?` | `MaybeRefOrGetter`\<[`UseLinkOptions`](../types/UseLinkOptions.md)\> |

### Returns

[`UseLink`](../types/UseLink.md)

## Call Signature

```ts
(
   source, 
   paramsOrOptions?, 
   maybeOptions?): UseLink;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `MaybeRefOrGetter`\< \| `undefined` \| `string` \| `Readonly`\<\{ `hash`: `string`; `href`: [`Url`](../types/Url.md); `id`: `TRoute`\[`"id"`\]; `matched`: `TRoute`\[`"matched"`\]; `matches`: `TRoute`\[`"matches"`\]; `name`: `TRoute`\[`"name"`\]; `params`: `ExtractRouteParamTypesReading`\<`TRoute`\>; `query`: `URLSearchParams`; `state`: `ExtractRouteStateParamsAsOptional`\<`TRoute`\[`"state"`\]\>; \}\>\> |
| `paramsOrOptions?` | `MaybeRefOrGetter`\< \| [`UseLinkOptions`](../types/UseLinkOptions.md) \| `Record`\<`PropertyKey`, `unknown`\>\> |
| `maybeOptions?` | `MaybeRefOrGetter`\<[`UseLinkOptions`](../types/UseLinkOptions.md)\> |

### Returns

[`UseLink`](../types/UseLink.md)

## Param

The name of the route or a valid URL.

## Param

If providing route name, this argument will expect corresponding params.

## Param

[RouterResolveOptions](../types/RouterResolveOptions.md) Same options as router resolve.

## Returns

Reactive context values for as well as navigation methods.
