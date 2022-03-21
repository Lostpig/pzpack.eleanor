import { checkFileExists } from '../../lib/io'
import { invokeIpc } from './ipc'
import { RendererLogger } from './logger'

export const openFile = async (): Promise<undefined | string> => {
  const file = await invokeIpc('fd:open', undefined)
  if (!file || file.length === 0) return

  const exists = checkFileExists(file)
  if (!exists) {
    RendererLogger.warning(`open file "${file}" not exists`)
    return
  }

  return file
}
export const saveFile = async (): Promise<undefined | string> => {
  const file = await invokeIpc('fd:save', undefined)
  if (!file || file.length === 0) return

  const exists = checkFileExists(file)
  if (exists) {
    RendererLogger.warning(`save file "${file}" is already exists`)
    return
  }

  return file
}
