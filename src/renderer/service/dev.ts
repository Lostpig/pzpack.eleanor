import { subscribeChannel, invokeIpc } from './ipc'
import { RendererLogger, PZDefaultLogger, LogLevel } from './logger'

const reloadCss = () => {
  const cssLink = document.getElementById('index-css') as HTMLLinkElement
  const parts = cssLink.href.split('?')

  cssLink.href = parts[0] + '?seed=' + Date.now()
}

export const initDevMode = async () => {
  const isDev = await invokeIpc('req:dev', undefined)
  if (isDev) {
    subscribeChannel('dev::cssreload', reloadCss)

    RendererLogger.consoleLevel = LogLevel.DEBUG
    RendererLogger.fileLevel = LogLevel.ERROR
    PZDefaultLogger.consoleLevel = LogLevel.DEBUG
    PZDefaultLogger.fileLevel = LogLevel.ERROR
  } else {
    RendererLogger.consoleLevel = LogLevel.WARNING
    RendererLogger.fileLevel = LogLevel.ERROR
    PZDefaultLogger.consoleLevel = LogLevel.WARNING
    PZDefaultLogger.fileLevel = LogLevel.ERROR
  }
}
