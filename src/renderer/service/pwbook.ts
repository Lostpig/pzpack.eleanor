import { PZSubscription } from 'pzpack'
import { invokeIpc, subscribeChannel } from './ipc'
import { bindingExplorer } from './pzpack'

type OpenedPwBook = {
  filename: string
}
const inst = new PZSubscription.PZBehaviorSubject<OpenedPwBook | null>(null)
const updater = new PZSubscription.PZSubject<string[]>()
subscribeChannel('pwbook:update', (res) => updater.next(res.items))

export const pwbookNotify = inst.toObservable()
export const pwbookUpdater = updater.toObservable()

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

  return await bindingExplorer(result.hash, result.port, result.loaderStatus)
}