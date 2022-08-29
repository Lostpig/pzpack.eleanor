import { initIpc, invokeIpc } from './ipc'
import { initI18n } from './i18n'
import { initDevMode } from './dev'
import { init } from './global'

export const initializeService = async () => {
  initIpc()
  const appInfo = await invokeIpc('application:getinfo', undefined)
  const pkgInfo = await invokeIpc('application:getpkg', undefined)
  init(appInfo, pkgInfo)

  await initI18n()
  await initDevMode()
}
