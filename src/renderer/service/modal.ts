import { PZSubscription } from 'pzpack'
import { checkFileExists } from '../../lib/io'
import { RendererLogger } from './logger'
import { invokeIpc } from './ipc'
import { binding } from './pzpack'

export type modalState = {
  dialog: 'none' | 'open' | 'save' | 'building' | 'extracting'
  args: string[]
}
const modalStateNotify = new PZSubscription.PZNotify<modalState>()

export const openFile = async () => {
  const file = await invokeIpc('fd:open', undefined)
  if (!file || file.length === 0) return
  if (file === binding.loader?.filename) return

  const exists = checkFileExists(file)
  if (!exists) {
    RendererLogger.warning(`open file "${file}" not exists`)
    return
  }

  modalStateNotify.next({ dialog: 'open', args: [file] })
}
export const saveFile = async () => {
  const file = await invokeIpc('fd:save', undefined)
  if (!file || file.length === 0) return

  const exists = checkFileExists(file)
  if (exists) {
    RendererLogger.warning(`save file "${file}" is already exists`)
    return
  }

  modalStateNotify.next({ dialog: 'save', args: [file] })
}
export const closeModal = () => {
  modalStateNotify.next({ dialog: 'none', args: [] })
}

export const modalObservable = modalStateNotify.asObservable()
