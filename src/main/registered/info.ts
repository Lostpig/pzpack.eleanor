import { config } from '../utils/config'
import { ROOT, RESOURCE, isDevMode, isDebug, PACKAGE } from '../utils/common'
import { registerInvoke, unregisterInvoke } from '../utils/ipc'
import { appWindow } from '../utils/window'

const register = () => {
  registerInvoke('application:inited', () => {
    return {
      maximize: !!appWindow.window?.isMaximized,
      theme: config.get('theme') ?? 'system'
    }
  })
  registerInvoke('application:getinfo', () => {
    return {
      DEV: isDevMode,
      DEBUG: isDebug,
      ROOT,
      RESOURCE
    }
  })
  registerInvoke('application:getpkg', () => {
    return PACKAGE
  })
}
const unregister = () => {
  unregisterInvoke('application:inited')
  unregisterInvoke('application:getinfo')
  unregisterInvoke('application:getpkg')
}

export {
  register,
  unregister
}