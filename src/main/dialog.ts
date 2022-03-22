import { dialog } from 'electron'
import { registerInvoke } from './ipc'

export const initializeDialog = () => {
  registerInvoke('fd:open', () => {
    const f = dialog.showOpenDialogSync({
      filters: [
        { name: 'PZPack', extensions: ['pzpk', 'pzmv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile', 'showHiddenFiles'],
    })

    return f?.[0] ?? ''
  })
  registerInvoke('fd:select', () => {
    const f = dialog.showOpenDialogSync({
      filters: [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'multiSelections', 'showHiddenFiles'],
    })

    return f ?? []
  })

  registerInvoke('fd:save', () => {
    const f = dialog.showSaveDialogSync({
      filters: [
        { name: 'PZPack', extensions: ['pzpk'] },
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
