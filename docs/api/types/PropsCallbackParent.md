# Types: PropsCallbackParent\<TParent\>

```ts
type PropsCallbackParent<TParent> = Route | undefined extends TParent ? GenericParent | undefined : TParent extends Route ? object : undefined;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tparent"></a> `TParent` *extends* [`Route`](Route.md) \| `undefined` | [`Route`](Route.md) \| `undefined` |
