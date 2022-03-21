import { nativeTheme } from 'electron'
import type { ConfigSet } from '../lib/declares'
import { config } from './config'
import { subscribeChannel, registerInvoke, sendToChannel } from './ipc'
import { AppLogger } from './logger'

const setTheme = (theme: Required<ConfigSet>['theme']) => {
  nativeTheme.themeSource = theme
  config.set('theme', theme)
  sendToChannel('theme::setted', theme)
  AppLogger.info(`native theme set to "${theme}"`)
}
const getTheme = () => {
  return nativeTheme.themeSource ?? 'system'
}

export const initializeTheme = () => {
  const theme = config.get('theme') ?? 'system'
  setTheme(theme)

  subscribeChannel('theme::set', setTheme)
  registerInvoke('req:theme', getTheme)
}
