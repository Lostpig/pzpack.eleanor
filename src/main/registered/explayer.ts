import { execFile } from 'node:child_process'
import * as path from 'path'
import * as fs from 'fs'
import { type PZSubscription } from 'pzpack'
import { appLogger } from '../utils/logger'
import { config } from '../utils/config'
import { getReceiver, registerInvoke, unregisterInvoke } from '../utils/ipc'

const subscriptions: PZSubscription.Subscription[] = []
const checkExplayer = (filename: string) => {
  const ext = path.extname(filename)
  if (ext !== '.exe') return false

  const binExists = fs.existsSync(filename)
  return binExists
}

const register = () => {
  const externalPlayerReceiver = getReceiver('exec:explayer')
  const subscription = externalPlayerReceiver.subscribe((data) => {
    const exPlayer = config.get('externalPlayer')
    if (!exPlayer) return

    if (ENV_DEV) appLogger.debug(`launch external player: ${exPlayer} ${data.url}`)
    execFile(exPlayer, [data.url])
  })
  subscriptions.push(subscription)

  registerInvoke('explayer:check', checkExplayer)
}
const unregister = () => {
  subscriptions.forEach((s) => s.unsubscribe())
  unregisterInvoke('explayer:check')
}

export { register, unregister }