import { nativeTheme } from 'electron'
import { ConfigSet } from '../lib/declares'
import { config } from './config'
import { subscribeChannel } from './ipc'
import { AppLogger } from './logger'

export const initializeTheme = () => {
  const theme = config.get('theme') ?? 'system'
  setTheme(theme)

  subscribeChannel('theme::set', setTheme)
}

const setTheme = (theme: Required<ConfigSet>['theme']) => {
  nativeTheme.themeSource = theme
  config.set('theme', theme)
  AppLogger.info(`native theme set to "${theme}"`)
}
