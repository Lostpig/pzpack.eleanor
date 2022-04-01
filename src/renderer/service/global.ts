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
    throw new Error('global info not inited')
  }

  return {
    appInfo,
    pkgInfo,
  }
}
