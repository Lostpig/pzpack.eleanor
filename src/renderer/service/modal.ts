import { PZSubscription } from 'pzpack'

export type modalState = {
  contents: {
    key: number
    element: React.ReactElement<{ key: number }>
  }[]
}
const modalStateNotify = new PZSubscription.PZBehaviorNotify<modalState>({ contents: [] })
const keyCounter = (() => {
  let i = 0
  return () => i++
})()

export const openModal = (element: React.ReactElement) => {
  const key = keyCounter()
  const state = modalStateNotify.current

  modalStateNotify.next({ contents: [...state.contents, { key, element }] })
}
export const closeModal = (key: number) => {
  const state = modalStateNotify.current
  const removed = state.contents.filter(c => c.key !== key)
  modalStateNotify.next({ contents: removed })
}

export const modalObservable = modalStateNotify.asObservable()
