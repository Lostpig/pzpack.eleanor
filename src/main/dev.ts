import * as fs from 'fs'
import * as path from 'path'
import { wait } from 'lib/utils'
import { RESOURCE, ROOT } from './common'
import { appWindow } from './window'
import { registerInvoke, sendToChannel } from './ipc'
import { AppLogger, PZDefaultLogger, LogLevel } from './logger'

const jsFile = path.join(RESOURCE, 'dist/renderer.js')
const cssFile = path.join(RESOURCE, 'dist/style.css')

const changeTrigger = (action: () => void) => {
  let triggerCounter = 0
  const excute = async () => {
    triggerCounter++
    await wait(500)
    triggerCounter--
    if (triggerCounter === 0) action()
  }
  return () => excute()
}
const watchBuild = () => {
  fs.watchFile(
    jsFile,
    changeTrigger(() => appWindow.reload()),
  )
  fs.watchFile(
    cssFile,
    changeTrigger(() => sendToChannel('dev::cssreload', null)),
  )
}

export const initializeDevMode = () => {
  const isDevMode = process.argv.indexOf('--dev') >= 1
  const isDebug = process.argv.indexOf('--debug') >= 1
  if (isDevMode) {
    watchBuild()
    AppLogger.debug('##### application boot on dev mode #####')
  }

  if (isDebug || isDevMode) {
    appWindow.openDevTool()

    AppLogger.consoleLevel = LogLevel.DEBUG
    AppLogger.fileLevel = LogLevel.INFO

    PZDefaultLogger.consoleLevel = LogLevel.DEBUG
    PZDefaultLogger.fileLevel = LogLevel.WARNING

    AppLogger.debug('##### application boot on debug mode #####')
    AppLogger.debug('application __dirname', __dirname)
    AppLogger.debug('application RESOURCE', RESOURCE)
    AppLogger.debug('application ROOT', ROOT)
  } else {
    AppLogger.consoleLevel = LogLevel.WARNING
    AppLogger.fileLevel = LogLevel.ERROR
    PZDefaultLogger.consoleLevel = LogLevel.WARNING
    PZDefaultLogger.fileLevel = LogLevel.ERROR
  }

  registerInvoke('req:dev', () => isDevMode)
}
