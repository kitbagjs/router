# Types: PropsCallbackContext\<TParent\>

```ts
type PropsCallbackContext<TParent> = object;
```

Context provided to props callback functions

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TParent` *extends* [`Route`](Route.md) \| `undefined` | [`Route`](Route.md) \| `undefined` |

## Type declaration

### parent

```ts
parent: PropsCallbackParent<TParent>;
```

### push

```ts
push: CallbackContext["push"];
```

### reject

```ts
reject: CallbackContext["reject"];
```

### replace

```ts
replace: CallbackContext["replace"];
```
