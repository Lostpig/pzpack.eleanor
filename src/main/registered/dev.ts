import * as fs from 'fs'
import * as path from 'path'
import { PZUtils } from 'pzpack'
import { RESOURCE, ROOT, isDebug } from '../utils/common'
import { appWindow } from '../utils/window'
import { getSender } from '../utils/ipc'
import { appLogger } from '../utils/logger'

const jsFile = path.join(RESOURCE, 'build/renderer.js')
const cssFile = path.join(RESOURCE, 'build/style.css')
let abort: AbortController

const changeTrigger = (action: () => void) => {
  let triggerCounter = 0
  const excute = async () => {
    triggerCounter++
    await PZUtils.wait(500)
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
  if (ENV_DEV) watchBuild()
  if (isDebug) {
    appWindow.openDevTool()

    appLogger.debug('##### application boot on debug mode #####')
    appLogger.debug('application __dirname', __dirname)
    appLogger.debug('application RESOURCE', RESOURCE)
    appLogger.debug('application ROOT', ROOT)
  }
}
const unregister = () => {
  unwatchBuild()
}

export {
  register,
  unregister
}