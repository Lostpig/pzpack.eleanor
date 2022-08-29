import { PZSubscription, PZUtils } from 'pzpack'

export type ModalContent = {
  key: number
  element: React.ReactElement<{ key: number }>
}
export type ModalState = {
  contents: ModalContent[]
}
const modalStateNotify = new PZSubscription.PZBehaviorSubject<ModalState>({ contents: [] })
const keyCounter = (() => {
  let i = 0
  return () => i++
})()

let modalChangingFlag = false
const modalHandleStore = new Map<number, PZSubscription.PZSubject<string | undefined>>()

const execOpenModal = (key: number, element: React.ReactElement, handle: PZSubscription.PZSubject<string | undefined>) => {
  if (modalChangingFlag) PZUtils.wait(1).then(() => execOpenModal(key, element, handle))

  modalChangingFlag = true
  const state = modalStateNotify.current
  modalStateNotify.next({ contents: [...state.contents, { key, element }] })
  modalHandleStore.set(key, handle)
  modalChangingFlag = false
}
export const openModal = (element: React.ReactElement) => {
  const key = keyCounter()
  const modalHandle = new PZSubscription.PZSubject<string | undefined>()
  execOpenModal(key, element, modalHandle)
  return modalHandle.toObservable()
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
  }
  modalStateNotify.next({ contents: remains })
  modalChangingFlag = false
}

export const modalObservable = modalStateNotify.toObservable()
