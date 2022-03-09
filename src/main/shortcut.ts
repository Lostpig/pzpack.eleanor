import { globalShortcut } from 'electron'
import { AppLogger } from './logger'
import { config } from './config'
import { appWindow } from './window'

const registerShortcut = (acc: Electron.Accelerator, desc: string, func: () => void) => {
  AppLogger.info(`Registering shortcut: ${acc}\t=> ${desc}`)
  try {
    globalShortcut.register(acc, func)
    return true
  } catch (err) {
    AppLogger.error(`Failed to register shortcut[${acc}]`)
    AppLogger.errorStack(err)
    return false
  }
}

const registerBossKey = () => {
  const accelerator = config.get('bosskey')
  if (accelerator) if (!registerShortcut(accelerator, 'Boss Key', appWindow.toggleVisibility)) config.set('bosskey', '')
}

export const shortcut = {
  register: () => {
    if (process.platform !== 'darwin') {
      registerBossKey()
    }
  },
  unregister: () => {
    globalShortcut.unregisterAll()
  },
}
