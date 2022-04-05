import { dialog } from 'electron'
import { registerInvoke, unregisterInvoke } from '../utils/ipc'

const register = () => {
  registerInvoke('operate:openfile', (filters?) => {
    const appendFilters = filters ?? []

    const f = dialog.showOpenDialogSync({
      filters: [...appendFilters, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'showHiddenFiles'],
    })

    return f?.[0] ?? ''
  })
  registerInvoke('operate:openfilemulti', (filters?) => {
    const appendFilters = filters ?? []

    const f = dialog.showOpenDialogSync({
      filters: [...appendFilters, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'multiSelections', 'showHiddenFiles'],
    })

    return f ?? []
  })
  registerInvoke('operate:savefile', (filters?) => {
    const appendFilters = filters ?? []

    const f = dialog.showSaveDialogSync({
      filters: [...appendFilters, { name: 'All Files', extensions: ['*'] }],
      properties: ['showHiddenFiles'],
    })

    return f ?? ''
  })
  registerInvoke('operate:openfolder', () => {
    const f = dialog.showOpenDialogSync({
      properties: ['openDirectory', 'promptToCreate', 'showHiddenFiles'],
    })

    return f?.[0] ?? ''
  })
}
const unregister = () => {
  unregisterInvoke('operate:openfile')
  unregisterInvoke('operate:openfilemulti')
  unregisterInvoke('operate:savefile')
  unregisterInvoke('operate:openfolder')
}

export { register, unregister }
