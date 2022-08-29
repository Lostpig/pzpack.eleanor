import * as devReg from './registered/dev'
import * as dialogReg from './registered/dialog'
import * as shortcutReg from './registered/shortcut'
import * as themeReg from './registered/theme'
import * as infoReg from './registered/info'
import * as configReg from './registered/config'
import * as pzpkReg from './registered/pzpk'
import * as pwbookReg from './registered/pwbook'
import * as explayerReg from './registered/explayer'

const items = [devReg, dialogReg, shortcutReg, themeReg, infoReg, configReg, pzpkReg, pwbookReg, explayerReg]

export const registerAll = () => {
  items.forEach((n) => n.register())
}
export const unregisterAll = () => {
  items.forEach((n) => n.unregister())
}
