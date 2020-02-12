import assertAll from './assert-all'

type ExcludeNullable<T, K extends keyof NonNullable<T>> = NonNullable<T> &
  {
    [k in K]-?: Exclude<NonNullable<T>[k], null | undefined>
  }

/**
 * Uses `assertAll` to assert the keys of an object are there and then returns
 * it. This is useful for asserting a codegen'ed graphQL type conforms to how
 * you're using it.
 */
function ensureKeys<T, K extends keyof NonNullable<T>>(
  obj: T,
  keysToCheck: K[]
): ExcludeNullable<T, K> {
  assertAll(obj, keysToCheck)
  return obj
}

export default ensureKeys
