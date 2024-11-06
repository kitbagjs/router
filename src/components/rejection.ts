import { Component, defineComponent, h } from 'vue'

export function genericRejection(type: string): Component {
  return defineComponent(() => {
    return () => h('h1', type)
  }, {
    name: type,
    props: [],
  })
}
