import { config } from '../utils/config'
import { registerInvoke, unregisterInvoke } from '../utils/ipc'

const register = () => {
  registerInvoke('config:set', (data) => {
    config.set(data.key, data.value)
  })
  registerInvoke('config:get', (key) => {
    return config.get(key)
  })
}
const unregister = () => {
  unregisterInvoke('config:set')
  unregisterInvoke('config:get')
}

export {
  register,
  unregister
}