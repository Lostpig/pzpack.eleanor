import * as path from 'path'
import * as fs from 'fs'
import { config } from '../utils/config'
import { ROOT, RESOURCE, isDebug, PACKAGE } from '../utils/common'
import { registerInvoke, unregisterInvoke } from '../utils/ipc'
import { appWindow } from '../utils/window'

const register = () => {
  registerInvoke('application:inited', () => {
    return {
      maximize: !!appWindow.window?.isMaximized(),
      theme: config.get('theme') ?? 'system'
    }
  })
  registerInvoke('application:getinfo', () => {
    return {
      DEBUG: isDebug,
      ROOT,
      RESOURCE
    }
  })
  registerInvoke('application:getpkg', () => {
    return PACKAGE
  })

  registerInvoke('load:text', (file: string) => {
    const filePath = path.join(RESOURCE, file)
    const text = fs.readFileSync(filePath, { encoding: 'utf8' })
    return text
  })
  registerInvoke('application:clearcache', () => {
    return appWindow.clearCache()
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