import { app } from 'electron'
import { registerInvoke } from './ipc'
import { ROOT, PACKAGE } from './common'
import { appWindow } from './window'
import { AppLogger } from './logger'
import { config } from './config'
import { initializeTheme } from './theme'
import { initializeDialog } from './dialog'
import { initializeDevMode } from './dev'

const registerInvokes = () => {
  registerInvoke('req:root', () => ROOT)
  registerInvoke('req:package', () => PACKAGE)
  registerInvoke('req:config', (key) => {
    return config.get(key)
  })
  registerInvoke('set:config', (data) => {
    return config.set(data.key, data.value)
  })
}

const boot = async () => {
  await app.whenReady()
  appWindow.start()

  registerInvokes()
  initializeTheme()
  initializeDialog()
  initializeDevMode()

  app.on('activate', function () {
    appWindow.resume()
  })
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
  })
  app.on('will-quit', () => {
    config.save()
  })
  // Uncaught error
  process.on('uncaughtException', (e) => {
    AppLogger.errorStack(e)
  })
}

boot()
