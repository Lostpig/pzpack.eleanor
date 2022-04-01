import { globalShortcut } from 'electron'
import { AppLogger } from '../utils/logger'
import { config } from '../utils/config'
import { appWindow } from '../utils/window'

const registerShortcut = (acc: Electron.Accelerator, desc: string, func: () => void) => {
  AppLogger.info(`Registering shortcut: ${acc} => ${desc}`)
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

const register = () => {
  if (process.platform !== 'darwin') {
    registerBossKey()
  }
}
const unregister = () => {
  globalShortcut.unregisterAll()
}

export {
  register,
  unregister
}
