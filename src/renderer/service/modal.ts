import { PZSubscription } from 'pzpack'
import { nextTick } from '../../lib/utils'
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

let modalChangingFlag = false
const modalHandleStore = new Map<number, PZSubscription.PZNotify<string | undefined>>()

const execOpenModal = (key: number, element: React.ReactElement, handle: PZSubscription.PZNotify<string | undefined>) => {
  modalChangingFlag = true
  const state = modalStateNotify.current
  modalStateNotify.next({ contents: [...state.contents, { key, element }] })
  modalHandleStore.set(key, handle)
  modalChangingFlag = false
}
export const openModal = (element: React.ReactElement) => {
  const key = keyCounter()
  const modalHandle = new PZSubscription.PZNotify<string | undefined>()
  if (modalChangingFlag) nextTick().then(() => execOpenModal(key, element, modalHandle))
  else execOpenModal(key, element, modalHandle)

  return modalHandle.asObservable()
}
export const closeModal = (key: number, result?: string) => {
  modalChangingFlag = true
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
  modalChangingFlag = false
}

export const modalObservable = modalStateNotify.asObservable()
