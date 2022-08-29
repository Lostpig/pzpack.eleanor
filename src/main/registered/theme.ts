import { nativeTheme } from 'electron'
import type { Theme } from '../../lib/declares'
import { config } from '../utils/config'
import { registerInvoke, getSender, unregisterInvoke } from '../utils/ipc'
import { appLogger } from '../utils/logger'

const themeSender = getSender('theme:changed')

const setTheme = (theme: Theme) => {
  nativeTheme.themeSource = theme
  config.set('theme', theme)
  themeSender.send(theme)
  appLogger.info(`native theme set to "${theme}"`)
}
const getTheme = () => {
  return nativeTheme.themeSource ?? 'system'
}

const register = () => {
  const theme = config.get('theme') ?? 'system'
  setTheme(theme)
  
  registerInvoke('theme:get', getTheme)
  registerInvoke('theme:set', setTheme)
}
const unregister = () => {
  unregisterInvoke('theme:get')
  unregisterInvoke('theme:set')
}

export {
  register,
  unregister
}