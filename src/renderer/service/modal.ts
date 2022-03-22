import { PZSubscription } from 'pzpack'
import { RendererLogger } from './logger'

export type ModalContent = {
  key: number
  element: React.ReactElement<{ key: number }>
}
export type ModalState = {
  contents: ModalContent[]
}
const modalStateNotify = new PZSubscription.PZBehaviorNotify<ModalState>({ contents: [] })
const keyCounter = (() => {
  let i = 0
  return () => i++
})()

const modalHandleStore = new Map<number, PZSubscription.PZNotify<string | undefined>>()
export const openModal = (element: React.ReactElement) => {
  const key = keyCounter()
  const state = modalStateNotify.current

  const modalHandle = new PZSubscription.PZNotify<string | undefined>()
  modalHandleStore.set(key, modalHandle)
  modalStateNotify.next({ contents: [...state.contents, { key, element }] })
  return modalHandle.asObservable()
}
export const closeModal = (key: number, result?: string) => {
  const state = modalStateNotify.current
  let removed: ModalContent | undefined
  const remains: ModalContent[] = []
  for (const item of state.contents) {
    if (item.key === key) removed = item
    else remains.push(item)
  }

  if (removed) {
    const handle = modalHandleStore.get(removed.key)
    handle?.next(result)
    handle?.complete()
    modalHandleStore.delete(removed.key)
  } else {
    RendererLogger.warning(`close modal id = "${key}" not found`)
  }
  modalStateNotify.next({ contents: remains })
}

export const modalObservable = modalStateNotify.asObservable()
