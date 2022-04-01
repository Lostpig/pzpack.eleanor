import * as fs from 'fs'
import * as path from 'path'
import { wait } from 'lib/utils'
import { RESOURCE, ROOT, isDevMode, isDebug } from '../utils/common'
import { appWindow } from '../utils/window'
import { getSender } from '../utils/ipc'
import { AppLogger, PZDefaultLogger, LogLevel } from '../utils/logger'

const jsFile = path.join(RESOURCE, 'build/renderer.js')
const cssFile = path.join(RESOURCE, 'build/style.css')
let abort: AbortController

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
  if (abort) abort.abort()
  abort = new AbortController()

  const cssReloadSender = getSender('dev:reloadcss')
  fs.watch(jsFile, { signal: abort.signal }, changeTrigger(() => appWindow.reload()))
  fs.watch(cssFile, { signal: abort.signal }, changeTrigger(() => cssReloadSender.send()))
}
const unwatchBuild = () => {
  abort?.abort()
}

const register = () => {
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
}
const unregister = () => {
  unwatchBuild()
}

export {
  register,
  unregister
}