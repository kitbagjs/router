# Types: UseLink

```ts
type UseLink = object;
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="element"></a> `element` | `Ref`\<`HTMLElement` \| `undefined`\> | A template ref to bind to the dom for automatic prefetching |
| <a id="href"></a> `href` | `ComputedRef`\<[`UrlString`](UrlString.md) \| `undefined`\> | Resolved URL with params interpolated and query applied. Same value as `router.resolve`. |
| <a id="isactive"></a> `isActive` | `ComputedRef`\<`boolean`\> | True if route matches current URL, or is a parent route that matches the parent of the current URL. |
| <a id="isexactactive"></a> `isExactActive` | `ComputedRef`\<`boolean`\> | True if route matches current URL exactly. |
| <a id="isexactmatch"></a> `isExactMatch` | `ComputedRef`\<`boolean`\> | True if route matches current URL. Route is the same as what's currently stored at `router.route`. |
| <a id="isexternal"></a> `isExternal` | `ComputedRef`\<`boolean`\> | - |
| <a id="ismatch"></a> `isMatch` | `ComputedRef`\<`boolean`\> | True if route matches current URL or is ancestor of route that matches current URL |
| <a id="push"></a> `push` | (`options?`) => `Promise`\<`void`\> | Convenience method for executing `router.push` with route context passed in. |
| <a id="replace"></a> `replace` | (`options?`) => `Promise`\<`void`\> | Convenience method for executing `router.replace` with route context passed in. |
| <a id="route"></a> `route` | `ComputedRef`\<[`ResolvedRoute`](ResolvedRoute.md) \| `undefined`\> | ResolvedRoute if matched. Same value as `router.find` |
