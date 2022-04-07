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

export const createUrl = (port: number, hash: string, pathname: string) => {
  const p = encodeURI(pathname)
  return `http://localhost:${port}/${hash}/${p}`
}
export const createFileUrl = (port: number, hash: string, pid: number, filename: string) => {
  return createUrl(port, hash, `${pid}/${filename}`)
}

export const throttling = <F extends (...args: any[]) => any>(func: F, frequency: number = 500): F => {
  const fr = frequency > 0 ? frequency : 0
  if (fr === 0) return func

  let lastCall = 0
  let lastRet: ReturnType<F>
  return ((...args: any[]) => {
    const now = Date.now()
    if (lastCall > 0 && now - lastCall < fr) {
      return lastRet!
    } else {
      lastCall = now
      lastRet = func(...args)
      return lastRet
    }
  }) as F
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
      get() {
        if (innerValue === undefined) innerValue = factory()
        return innerValue
      },
      set(value) {
        if (!readonly) {
          innerValue = value
        }
      },
    },
  })
  return instance
}
export { lazyValue }
