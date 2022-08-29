import type { PZFilePacked } from "pzpack"

export const formatTime = (timeSeconds: number) => {
  const hours = Math.trunc(timeSeconds / 3600)
  const minutes = Math.trunc(timeSeconds / 60) % 60
  const seconds = Math.trunc(timeSeconds) % 60

  const f2 = (s: number) => {
    return ('00' + s.toString()).slice(-2)
  }

  return `${f2(hours)}:${f2(minutes)}:${f2(seconds)}`
}
export const formatFileSize = (size: number) => {
  const suffix = [' KB', ' MB', ' GB', ' TB', ' PB']

  let count = 0
  let n = size / 1024
  while (n > 1024 && count < suffix.length) {
    n /= 1024
    count++
  }
  return n.toFixed(1) + suffix[count]
}

export const createFileUrl = (port: number, hash: string, file: PZFilePacked) => {
  return `http://localhost:${port}/file/${hash}/${file.fid}`
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
