# Compositions: useNavigation

```ts
const useNavigation: RouterAssets<RegisteredRouter>["useNavigation"];
```

A composition to access the navigation under way: whether one is pending, which routes it leaves and
leads to, and how much of the work it waits on has settled.

## Returns

Reactive state of the navigation under way.
