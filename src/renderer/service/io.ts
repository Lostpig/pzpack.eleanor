import { defFilters } from '../utils'
import { invokeIpc } from './ipc'

export const openFile = async (filters?: Electron.FileFilter[]): Promise<undefined | string> => {
  const fts = filters && filters.length > 0 ? filters : [defFilters.PZPack]

  const file = await invokeIpc('operate:openfile', fts)
  if (!file || file.length === 0) return
  return file
}
export const saveFile = async (filters?: Electron.FileFilter[]): Promise<undefined | string> => {
  const file = await invokeIpc('operate:savefile', filters)
  if (!file || file.length === 0) return
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
  return files
}
export const scanDir = async () => {
  const res = await invokeIpc('operate:scanfolder', undefined)
  return res
}
