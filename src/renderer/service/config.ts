import type { ConfigKey, ConfigValue } from '../../lib/declares'
import { invokeIpc, sendToChannel } from './ipc'

export const getConfig = <K extends ConfigKey>(key: K) => {
  return invokeIpc('config:get', key) as Promise<ConfigValue<K>>
}
export const setConfig = <K extends ConfigKey>(key: K, value: ConfigValue<K>) => {
  return invokeIpc('config:set', { key, value })
}

export const checkExternalPlayer = async (filename: string) => {
  return invokeIpc('explayer:check', filename)
}
export const openExternalPlayer = (url: string) => {
  sendToChannel('exec:explayer', { url })
}
export const externalPlayerExists = () => {
  return getConfig('externalPlayer').then((val) => {
    return !!val
  })
}