import { registerInvoke, unregisterInvoke } from '../utils/ipc'
import { openPZloader, closePZloader, cancelTask, startBuild, startExtract, getIndex } from '../utils/pzpk'

const register = () => {
  registerInvoke('pzpk:open', openPZloader)
  registerInvoke('pzpk:getIndex', getIndex)
  registerInvoke('pzpk:close', closePZloader)
  registerInvoke('pzpk:build', startBuild)
  registerInvoke('pzpk:extract', startExtract)
  registerInvoke('pzpk:canceltask', cancelTask)
}
const unregister = () => {
  unregisterInvoke('pzpk:open')
  unregisterInvoke('pzpk:getIndex')
  unregisterInvoke('pzpk:close')
  unregisterInvoke('pzpk:build')
  unregisterInvoke('pzpk:extract')
  unregisterInvoke('pzpk:canceltask')
}

export { register, unregister }
