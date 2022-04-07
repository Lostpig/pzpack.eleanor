import { execFile } from 'node:child_process'
import { type PZSubscription } from 'pzpack'
import { AppLogger } from '../utils/logger'
import { config } from '../utils/config'
import { getReceiver, registerInvoke, unregisterInvoke } from '../utils/ipc'
import { openPZloader, closePZInstance, startPZBuild, startPZMVBuild, loadIndexData } from '../utils/pzpk'

const subscriptions: PZSubscription.Subscription[] = []

const externalPlayerReceiver = getReceiver('exec:explayer')
const registerExternalPlayer = () => {
  const subscription = externalPlayerReceiver.subscribe((data) => {
    const exPlayer = config.get('externalPlayer')
    if (!exPlayer) return

    AppLogger.debug(`launch external player: ${exPlayer} ${data.url}`)
    execFile(exPlayer, [data.url])
  })
  subscriptions.push(subscription)
}
const registerPZPKHandlers = () => {
  registerInvoke('pzpk:open', (data) => {
    return openPZloader(data.filename, data.password)
  })
  registerInvoke('pzpk:close', (id) => {
    return closePZInstance(id)
  })
  registerInvoke('pzpk:pack', (data) => {
    if (data.type === 'PZPACK') {
      const { options, indexData } = data
      return startPZBuild(indexData, options)
    } else {
      const { options, indexData, target } = data
      return startPZMVBuild(target, indexData, options)
    }
  })
  registerInvoke('pzpk:getIndex', (id) => {
    return loadIndexData(id)
  })
}
const unregisterPZPKHandlers = () => {
  unregisterInvoke('pzpk:open')
  unregisterInvoke('pzpk:close')
  unregisterInvoke('pzpk:pack')
  unregisterInvoke('pzpk:getIndex')
}

const register = () => {
  registerExternalPlayer()
  registerPZPKHandlers()
}
const unregister = () => {
  subscriptions.forEach((s) => s.unsubscribe())
  unregisterPZPKHandlers()
}

export { register, unregister }
