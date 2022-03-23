import { checkFileExists } from '../../lib/io'
import { invokeIpc } from './ipc'
import { RendererLogger } from './logger'

export const openFile = async (filters?: Electron.FileFilter[]): Promise<undefined | string> => {
  const fts = filters && filters.length > 0 ? filters : [{ name: 'PZPack', extensions: ['pzpk', 'pzmv'] }]

  const file = await invokeIpc('fd:open', fts)
  if (!file || file.length === 0) return

  const exists = checkFileExists(file)
  if (!exists) {
    RendererLogger.warning(`open file "${file}" not exists`)
    return
  }

  return file
}

export const saveFile = async (): Promise<undefined | string> => {
  const file = await invokeIpc('fd:save', 'PZPACK')
  if (!file || file.length === 0) return

  const exists = checkFileExists(file)
  if (exists) {
    RendererLogger.warning(`save file "${file}" is already exists`)
    return
  }

  return file
}
export const openDir = async (): Promise<undefined | string> => {
  const dir = await invokeIpc('fd:dir', undefined)
  if (!dir || dir.length === 0) return

  return dir
}
export const selectFiles = async (): Promise<string[]> => {
  const files = await invokeIpc('fd:select', undefined)
  if (!files || files.length === 0) return []

  const existsFiles: string[] = []
  for (const file of files) {
    const exists = checkFileExists(file)
    if (!exists) {
      RendererLogger.warning(`open file "${file}" not exists`)
      continue
    }
    existsFiles.push(file)
  }

  return existsFiles
}
export const selectVideos = async (): Promise<string[]> => {
  const files = await invokeIpc('fd:select', [{ name: 'Video', extensions: ['mp4', 'mkv', 'avi'] }])
  if (!files || files.length === 0) return []

  const existsFiles: string[] = []
  for (const file of files) {
    const exists = checkFileExists(file)
    if (!exists) {
      RendererLogger.warning(`open file "${file}" not exists`)
      continue
    }
    existsFiles.push(file)
  }

  return existsFiles
}
export const saveVideo = async (): Promise<undefined | string> => {
  const file = await invokeIpc('fd:save', 'PZVIDEO')
  if (!file || file.length === 0) return

  const exists = checkFileExists(file)
  if (exists) {
    RendererLogger.warning(`save file "${file}" is already exists`)
    return
  }

  return file
}
