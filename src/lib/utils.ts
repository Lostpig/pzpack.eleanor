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