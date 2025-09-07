# Types: PropsCallbackParent\<TParent\>

```ts
type PropsCallbackParent<TParent> = Route | undefined extends TParent ? 
  | undefined
  | {
  name: string;
  props: unknown;
} : TParent extends Route ? object : undefined;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TParent` *extends* [`Route`](Route.md) \| `undefined` | [`Route`](Route.md) \| `undefined` |
