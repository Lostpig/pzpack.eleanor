import * as path from 'path'
import { initIpc, invokeIpc } from './ipc'
import { initI18n } from './i18n'
import { initDevMode } from './dev'
import { init } from './global'
import { RendererLogger } from './logger'

export const initializeService = async () => {
  initIpc()
  const appInfo = await invokeIpc('application:getinfo', undefined)
  const pkgInfo = await invokeIpc('application:getpkg', undefined)
  init(appInfo, pkgInfo)

  RendererLogger.enableFileLog(path.join(appInfo.ROOT, 'data/log/renderer.log'))

  await initI18n()
  await initDevMode()
}
