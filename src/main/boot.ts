import { app } from 'electron'
import { appWindow } from './utils/window'
import { AppLogger } from './utils/logger'
import { config } from './utils/config'
import { registerAll, unregisterAll } from './register'

const boot = async () => {
  await app.whenReady()
  appWindow.start()
  registerAll()

  app.on('activate', function () {
    appWindow.resume()
  })
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  app.on('will-quit', () => {
    unregisterAll()
    config.save()
  })
  // Uncaught error
  process.on('uncaughtException', (e) => {
    AppLogger.errorStack(e)
  })
}

boot()
