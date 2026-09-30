# Types: RouterProgressProps

```ts
type RouterProgressProps = object;
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="color"></a> `color?` | `string` | The color of the bar. Defaults to the `--router-progress-color` custom property, then a blue. |
| <a id="delay"></a> `delay?` | `number` | How long a navigation must be pending before the bar appears, in milliseconds. Fast navigations never flash a bar. Defaults to 150. |
| <a id="label"></a> `label?` | `string` | The accessible name of the bar, read out by screen readers. Defaults to "Loading page". |
