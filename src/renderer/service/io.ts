import { checkFileExists } from '../../lib/io'
import { defFilters } from '../utils'
import { invokeIpc } from './ipc'
import { RendererLogger } from './logger'

export const openFile = async (filters?: Electron.FileFilter[]): Promise<undefined | string> => {
  const fts = filters && filters.length > 0 ? filters : [defFilters.PZFiles]

  const file = await invokeIpc('operate:openfile', fts)
  if (!file || file.length === 0) return

  const exists = checkFileExists(file)
  if (!exists) {
    RendererLogger.warning(`open file "${file}" not exists`)
    return
  }

  return file
}
export const saveFile = async (filters?: Electron.FileFilter[]): Promise<undefined | string> => {
  const file = await invokeIpc('operate:savefile', filters)
  if (!file || file.length === 0) return

  const exists = checkFileExists(file)
  if (exists) {
    RendererLogger.warning(`save file "${file}" is already exists`)
    return
  }

  return file
}
export const openDir = async (): Promise<undefined | string> => {
  const dir = await invokeIpc('operate:openfolder', undefined)
  if (!dir || dir.length === 0) return

  return dir
}
export const selectFiles = async (): Promise<string[]> => {
  const files = await invokeIpc('operate:openfilemulti', undefined)
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
  const files = await invokeIpc('operate:openfilemulti', [{ name: 'Video', extensions: ['mp4', 'mkv', 'avi'] }])
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