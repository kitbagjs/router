# Compositions: useLink()

## Call Signature

```ts
function useLink<TRouteKey>(name, ...args): UseLink
```

A composition to export much of the functionality that drives RouterLink component. Can be given route details to discover resolved URL,
or resolved URL to discover route details. Also exports some useful context about routes relationship to current URL and convenience methods
for navigating.

### Type Parameters

| Type Parameter |
| ------ |
| `TRouteKey` *extends* `string` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `MaybeRefOrGetter`\<`TRouteKey`\> |
| ...`args` | [`MaybeRefOrGetter`\<\{\}\>, `MaybeRefOrGetter`\<[`UseLinkOptions`](../types/UseLinkOptions.md)\>] |

### Returns

[`UseLink`](../types/UseLink.md)

Reactive context values for as well as navigation methods.

## Call Signature

```ts
function useLink(url, options?): UseLink
```

A composition to export much of the functionality that drives RouterLink component. Can be given route details to discover resolved URL,
or resolved URL to discover route details. Also exports some useful context about routes relationship to current URL and convenience methods
for navigating.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `MaybeRefOrGetter`\<[`Url`](../types/Url.md)\> | - |
| `options`? | `MaybeRefOrGetter`\<[`UseLinkOptions`](../types/UseLinkOptions.md)\> | RouterResolveOptions Same options as router resolve. |

### Returns

[`UseLink`](../types/UseLink.md)

Reactive context values for as well as navigation methods.

## Call Signature

```ts
function useLink(resolvedRoute, options?): UseLink
```

A composition to export much of the functionality that drives RouterLink component. Can be given route details to discover resolved URL,
or resolved URL to discover route details. Also exports some useful context about routes relationship to current URL and convenience methods
for navigating.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resolvedRoute` | `MaybeRefOrGetter`\< \| `undefined` \| `Readonly`\<\{ `hash`: `string`; `href`: [`Url`](../types/Url.md); `id`: `string`; `matched`: `CreateRouteOptionsMatched`\<`string`\>; `matches`: `CreateRouteOptionsMatched`\<`undefined` \| `string`\>[]; `name`: `string`; `params`: \{\}; `query`: `URLSearchParams`; `state`: \{\}; \}\>\> | - |
| `options`? | `MaybeRefOrGetter`\<[`UseLinkOptions`](../types/UseLinkOptions.md)\> | RouterResolveOptions Same options as router resolve. |

### Returns

[`UseLink`](../types/UseLink.md)

Reactive context values for as well as navigation methods.

## Call Signature

```ts
function useLink(
   source, 
   paramsOrOptions?, 
   maybeOptions?): UseLink
```

A composition to export much of the functionality that drives RouterLink component. Can be given route details to discover resolved URL,
or resolved URL to discover route details. Also exports some useful context about routes relationship to current URL and convenience methods
for navigating.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `MaybeRefOrGetter`\< \| `undefined` \| `string` \| `Readonly`\<\{ `hash`: `string`; `href`: [`Url`](../types/Url.md); `id`: `string`; `matched`: `CreateRouteOptionsMatched`\<`string`\>; `matches`: `CreateRouteOptionsMatched`\<`undefined` \| `string`\>[]; `name`: `string`; `params`: \{\}; `query`: `URLSearchParams`; `state`: \{\}; \}\>\> | The name of the route or a valid URL. |
| `paramsOrOptions`? | `MaybeRefOrGetter`\< \| `Record`\<`PropertyKey`, `unknown`\> \| [`UseLinkOptions`](../types/UseLinkOptions.md)\> | - |
| `maybeOptions`? | `MaybeRefOrGetter`\<[`UseLinkOptions`](../types/UseLinkOptions.md)\> | - |

### Returns

[`UseLink`](../types/UseLink.md)

Reactive context values for as well as navigation methods.
