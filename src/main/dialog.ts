import { dialog } from 'electron'
import { registerInvoke } from './ipc'

export const initializeDialog = () => {
  registerInvoke('fd:open', (filters?) => {
    const appendFilters = filters ?? []

    const f = dialog.showOpenDialogSync({
      filters: [...appendFilters, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'showHiddenFiles'],
    })

    return f?.[0] ?? ''
  })
  registerInvoke('fd:select', (filters?) => {
    const appendFilters = filters ?? []

    const f = dialog.showOpenDialogSync({
      filters: [...appendFilters, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'multiSelections', 'showHiddenFiles'],
    })

    return f ?? []
  })

  registerInvoke('fd:save', (type) => {
    const f = dialog.showSaveDialogSync({
      filters: [
        { name: type, extensions: [type === 'PZPACK' ? 'pzpk' : 'pzmv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['showHiddenFiles'],
    })

    return f ?? ''
  })

  registerInvoke('fd:dir', () => {
    const f = dialog.showOpenDialogSync({
      properties: ['openDirectory', 'promptToCreate', 'showHiddenFiles'],
    })

    return f?.[0] ?? ''
  })
}
