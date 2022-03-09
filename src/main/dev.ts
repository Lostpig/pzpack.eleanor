import * as fs from 'fs'
import * as path from 'path'
import { wait } from 'lib/utils'
import { ROOT } from './common'
import { appWindow } from './window'
import { registerInvoke, sendToChannel } from './ipc'
import { AppLogger } from './logger'

const jsFile = path.join(ROOT, 'dist/renderer.js')
const cssFile = path.join(ROOT, 'dist/style.css')


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
  fs.watchFile(jsFile, changeTrigger(() => appWindow.reload()))
  fs.watchFile(cssFile, changeTrigger(() => sendToChannel('dev::cssreload', null)))
}

export const initializeDevMode = () => {
  let isDevMode = process.argv.indexOf('--dev') > 1
  if (isDevMode) {
    watchBuild()
    appWindow.openDevTool()
    AppLogger.debug('##### application boot on dev mode #####')
  } 

  registerInvoke('req:dev', () => isDevMode)
}
