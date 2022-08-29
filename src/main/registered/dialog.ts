import { dialog } from 'electron'
import { registerInvoke, unregisterInvoke } from '../utils/ipc'
import { checkFileExists, scanAllFiles } from '../utils/io'
import { appLogger } from '../utils/logger'

const register = () => {
  registerInvoke('operate:openfile', (filters?) => {
    const appendFilters = filters ?? []

    const f = dialog.showOpenDialogSync({
      filters: [...appendFilters, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'showHiddenFiles'],
    })
    const filename = f?.[0] ?? ''

    if (filename) {
      const exists = checkFileExists(filename)
      if (!exists) {
        appLogger.warning(`open file "${filename}" not exists`)
        return ''
      }
    }
    return filename
  })
  registerInvoke('operate:openfilemulti', (filters?) => {
    const appendFilters = filters ?? []

    const f = dialog.showOpenDialogSync({
      filters: [...appendFilters, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'multiSelections', 'showHiddenFiles'],
    })

    const files = f ?? []
    const existsFiles: string[] = []
    for (const file of files) {
      const exists = checkFileExists(file)
      if (!exists) {
        appLogger.warning(`open file "${file}" not exists`)
        continue
      }
      existsFiles.push(file)
    }

    return existsFiles
  })
  registerInvoke('operate:savefile', (filters?) => {
    const appendFilters = filters ?? []

    const f = dialog.showSaveDialogSync({
      filters: [...appendFilters, { name: 'All Files', extensions: ['*'] }],
      properties: ['showHiddenFiles'],
    })

    const file = f ?? ''
    if (file) {
      const exists = checkFileExists(file)
      if (exists) {
        appLogger.warning(`save file "${file}" is already exists`)
        return ''
      }
    }

    return file
  })
  registerInvoke('operate:openfolder', () => {
    const f = dialog.showOpenDialogSync({
      properties: ['openDirectory', 'promptToCreate', 'showHiddenFiles'],
    })

    return f?.[0] ?? ''
  })
  registerInvoke('operate:scanfolder', () => {
    const f = dialog.showOpenDialogSync({
      properties: ['openDirectory', 'promptToCreate', 'showHiddenFiles'],
    })
    const folder = f?.[0] ?? ''
    if (folder) {
      return {
        folder,
        files: scanAllFiles(folder)
      }
    }
    return {
      folder,
      files: []
    }
  })
}
const unregister = () => {
  unregisterInvoke('operate:openfile')
  unregisterInvoke('operate:openfilemulti')
  unregisterInvoke('operate:savefile')
  unregisterInvoke('operate:openfolder')
}

export { register, unregister }
