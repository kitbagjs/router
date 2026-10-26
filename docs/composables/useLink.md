# useLink

Used to create a link to a route. Generally the [`RouterLink`](/components/router-link) component should be used instead of this composable. See the ['UseLink'](/api/types/UseLink) api reference for more information on the return type.

```ts
import { useLink } from '@kitbag/router'

const link = useLink('profile', { userId: 123 })
```

:::tip
[Register](/quick-start.html#type-safety) your router to get the proper types when using this composable.
:::
