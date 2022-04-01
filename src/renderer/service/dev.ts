import { subscribeChannel } from './ipc'
import { getInfo } from './global'
import { RendererLogger, LogLevel } from './logger'

const reloadCss = () => {
  const cssLink = document.getElementById('index-css') as HTMLLinkElement
  const parts = cssLink.href.split('?')

  cssLink.href = parts[0] + '?seed=' + Date.now()
}

export const initDevMode = async () => {
  const info = getInfo()
  if (info.appInfo.DEV) {
    subscribeChannel('dev:reloadcss', reloadCss)
  }
  if (info.appInfo.DEV || info.appInfo.DEBUG) {
    RendererLogger.consoleLevel = LogLevel.DEBUG
    RendererLogger.fileLevel = LogLevel.ERROR
  } else {
    RendererLogger.consoleLevel = LogLevel.SILENT
    RendererLogger.fileLevel = LogLevel.ERROR
  }
}
