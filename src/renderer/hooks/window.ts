import { useState, useEffect, useCallback } from 'react'
import { getConfig } from '../service/config'
import { sendToChannel, subscribeChannel } from '../service/ipc'

let windowStateInited = false
export const useWindowState = () => {
  const [maximize, setMaximize] = useState(false)
  useEffect(() => {
    if (!windowStateInited) {
      getConfig('maximizi').then((m) => setMaximize(!!m))
      windowStateInited = true
    }

    const subscription = subscribeChannel('window::changed', (v) => {
      if (v === 'maximize') {
        setMaximize(true)
      } else if (v === 'unmaximize') {
        setMaximize(false)
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const toggleMaximize = useCallback(() => {
    sendToChannel('window::operate', 'maximize')
  }, [])

  return [maximize, toggleMaximize] as [boolean, () => void]
}
