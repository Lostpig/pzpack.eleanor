export const wait = (ms: number) => {
  if (ms <= 0) {
    return Promise.resolve()
  }

  return new Promise<void>((res) => {
    setTimeout(res, ms)
  })
}
export const nextTick = () => {
  return new Promise<void>((res) => {
    process.nextTick(() => {
      res()
    })
  })
}

type LazyFactory<T> = () => T
type LazyValue<T> = {
  value: T
}

function lazyValue<T>(factory: LazyFactory<T>, readonly: true): Readonly<LazyValue<T>>
function lazyValue<T>(factory: LazyFactory<T>, readonly?: false): LazyValue<T>
function lazyValue<T>(factory: LazyFactory<T>, readonly?: boolean) {
  const instance = Object.create({})
  let innerValue: T

  Object.defineProperties(instance, {
    value: {
      get () {
        if (innerValue === undefined) innerValue = factory()
        return innerValue
      },
      set (value) {
        innerValue = value
      },
      writable: !readonly
    }
  })
  return instance
}
export { lazyValue }