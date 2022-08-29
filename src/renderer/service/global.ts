import { PZExceptions } from 'pzpack'
import { errorCodes } from '../../lib/exceptions'
import { invokeIpc } from './ipc'
import type { AppliactionInfo, PackageInfo } from '../../lib/declares'

let inited = false
let appInfo: AppliactionInfo
let pkgInfo: PackageInfo

export const init = (app: AppliactionInfo, pkg: PackageInfo) => {
  appInfo = app
  pkgInfo = pkg
  inited = true
}

export const getInfo = () => {
  if (!inited) {
    throw new PZExceptions.PZError(errorCodes.ApplicationNotInited)
  }

  return {
    appInfo,
    pkgInfo,
  }
}

export const clearCache = () => {
  return invokeIpc('application:clearcache', undefined)
}