# Types: UseLink

```ts
type UseLink: object;
```

## Type declaration

### element

```ts
element: Ref<HTMLElement | undefined>;
```

A template ref to bind to the dom for automatic prefetching

### href

```ts
href: ComputedRef<Url | undefined>;
```

Resolved URL with params interpolated and query applied. Same value as `router.resolve`.

### isExactMatch

```ts
isExactMatch: ComputedRef<boolean>;
```

True if route matches current URL. Route is the same as what's currently stored at `router.route`.

### isExternal

```ts
isExternal: ComputedRef<boolean>;
```

### isMatch

```ts
isMatch: ComputedRef<boolean>;
```

True if route matches current URL or is ancestor of route that matches current URL

### push()

```ts
push: (options?) => Promise<void>;
```

Convenience method for executing `router.push` with route context passed in.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options`? | `RouterPushOptions` |

#### Returns

`Promise`\<`void`\>

### replace()

```ts
replace: (options?) => Promise<void>;
```

Convenience method for executing `router.replace` with route context passed in.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options`? | `RouterReplaceOptions` |

#### Returns

`Promise`\<`void`\>

### route

```ts
route: ComputedRef<ResolvedRoute | undefined>;
```

ResolvedRoute if matched. Same value as `router.find`
