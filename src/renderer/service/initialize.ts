import * as path from 'path'
import { LogLevel } from 'pzpack'
import { initIpc, invokeIpc } from './ipc'
import { initI18n } from './i18n'
import { initDevMode } from './dev'
import { RendererLogger } from './logger'


export const initializeService = async () => {
  initIpc()
  const root = await invokeIpc('req:root', undefined)
  RendererLogger.enableFileLog(path.join(root, 'data/log/renderer.log'))
  RendererLogger.fileLevel = LogLevel.WARNING

  await initI18n()
  await initDevMode()
}
