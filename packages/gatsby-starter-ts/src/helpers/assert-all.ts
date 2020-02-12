type ExcludeNullable<T, K extends keyof NonNullable<T>> = NonNullable<T> &
  {
    [k in K]-?: Exclude<NonNullable<T>[k], null | undefined>
  }

/**
 * This function asserts all the properties of a given object are defined and
 * throws otherwise. This is useful when checking if a GraphQL response conforms
 * to a certain typescript type.
 */
function assertAll<T, K extends keyof NonNullable<T>>(
  obj: T,
  keysToCheck: K[]
): asserts obj is ExcludeNullable<T, K> {
  if (obj === null) {
    throw new Error(`Expected an object but found null`)
  }
  if (obj === undefined) {
    throw new Error(`Expected an object but found undefined`)
  }
  const nonNullableObj = obj as NonNullable<T>

  for (const key of keysToCheck) {
    if (nonNullableObj[key] === null) {
      throw new Error(`Expected object to have key "${key}" but found null`)
    }
    if (nonNullableObj[key] === undefined) {
      throw new Error(
        `Expected object to have key "${key}" but found undefined`
      )
    }
  }
}

export default assertAll
