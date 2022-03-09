import { ConfigKey, ConfigValue } from '../../lib/declares'
import { invokeIpc } from './ipc'

export const getConfig = <K extends ConfigKey>(key: K) => {
  return invokeIpc('req:config', key) as Promise<ConfigValue<K>>
}
export const setConfig = <K extends ConfigKey>(key: K, value: ConfigValue<K>) => {
  return invokeIpc('set:config', { key, value })
}
