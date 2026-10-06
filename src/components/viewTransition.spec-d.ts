import { expectTypeOf, test } from 'vitest'
import { ViewTransition } from '@/components/viewTransition'

test('infers attributes from the rendered element', () => {
  const image = new ViewTransition({ name: 'photo', as: 'img', src: 'photo.jpg', alt: 'Photo' })
  const link = new ViewTransition({ name: 'photo', as: 'a', href: '/photo' })

  expectTypeOf(image.$props.src).toEqualTypeOf<string | undefined>()
  expectTypeOf(link.$props.href).toEqualTypeOf<string | undefined>()

  // @ts-expect-error - image sources are strings
  new ViewTransition({ name: 'photo', as: 'img', src: 123 })

  // @ts-expect-error - images do not have href attributes
  new ViewTransition({ name: 'photo', as: 'img', href: '/photo' })
})

test('uses span attributes when as is omitted', () => {
  new ViewTransition({ name: 'photo', class: 'caption' })

  // @ts-expect-error - spans do not have src attributes
  new ViewTransition({ name: 'photo', src: 'photo.jpg' })
})
