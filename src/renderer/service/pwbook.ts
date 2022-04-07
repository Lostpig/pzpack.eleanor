import { PZSubscription } from 'pzpack'
import { invokeIpc, subscribeChannel } from './ipc'
import { bindingPZloader } from './pzpack'

type OpenedPwBook = {
  filename: string
}
const inst = new PZSubscription.PZBehaviorNotify<OpenedPwBook | null>(null)
const updater = new PZSubscription.PZNotify<string[]>()
subscribeChannel('pwbook:update', (res) => updater.next(res.items))

export const pwbookNotify = inst.asObservable()
export const pwbookUpdater = updater.asObservable()

export const getCurrentPasswordBook = async () => {
  const result = await invokeIpc('pwbook:current', undefined)
  return result
}
export const openPasswordBook = async (filename: string, password: string, mode: 'open' | 'create') => {
  const result = await invokeIpc('pwbook:open', { filename, masterPw: password, mode })
  if (result.success) {
    inst.next({ filename: result.filename })
  }
  return result
}
export const closePasswordBook = async () => {
  const result = await invokeIpc('pwbook:close', undefined)
  if (result.success) {
    inst.next(null)
  }
  return result
}
export const addPassword = async (password: string) => {
  const result = await invokeIpc('pwbook:add', password)
  return result
}
export const deletePassword = async (hash: string) => {
  const result = await invokeIpc('pwbook:delete', hash)
  return result
}
export const tryOpenFile = async (file: string) => {
  const result = await invokeIpc('pwbook:tryopen', file)
  if (!result.success) return result

  return await bindingPZloader(result.hash, result.port, result.loaderStatus)
}