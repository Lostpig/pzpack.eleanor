import * as path from 'path'
import { initIpc, invokeIpc } from './ipc'
import { initI18n } from './i18n'
import { initDevMode } from './dev'
import { RendererLogger, PZDefaultLogger } from './logger'


export const initializeService = async () => {
  initIpc()
  const root = await invokeIpc('req:root', undefined)
  RendererLogger.enableFileLog(path.join(root, 'data/log/renderer.log'))
  PZDefaultLogger.enableFileLog(path.join(root, 'data/log/renderer-pz.log'))

  await initI18n()
  await initDevMode()
}
