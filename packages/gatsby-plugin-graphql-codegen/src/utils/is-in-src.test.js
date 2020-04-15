import { isInSrc } from './is-in-src'

it('disallow `src` in `fileName`', () => {
  const fixtures = [
    {
      pair: ['/a/src', '/a/src/a/b'],
      result: true,
    },
    {
      pair: ['/a/src', '/a/b/src/c'],
      result: false,
    },
    {
      pair: ['/a/src', '/a/src/c/d/e'],
      result: true,
    },
    {
      pair: ['/a/src', '/a/src/c/d/e'],
      result: true,
    },
  ]

  fixtures.forEach(({ pair, result }) => {
    expect(isInSrc(...pair)).toBe(result)
  })
})
