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

export const formatTime = (timeSeconds: number) => {
  const hours = Math.trunc(timeSeconds / 3600)
  const minutes = Math.trunc(timeSeconds / 60) % 60
  const seconds = Math.trunc(timeSeconds) % 60

  const f2 = (s: number) => {
    return ('00' + s.toString()).slice(-2)
  }

  return `${f2(hours)}:${f2(minutes)}:${f2(seconds)}`
}

export const createUrl = (port: number, pid: number, filename: string) => {
  const p = encodeURI(`${pid}/${filename}`)
  return `http://localhost:${port}/${p}`
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