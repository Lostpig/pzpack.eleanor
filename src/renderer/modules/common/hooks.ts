import { useEffect, useState, useCallback } from 'react'
import type {  Theme } from '../../../lib/declares'
import { modalObservable } from '../../service/modal'
import { PZInstanceObservable, type PZInstance } from '../../service/pzpack'
import { pwbookNotify } from '../../service/pwbook'
import { subscribeChannel, sendToChannel, invokeIpc } from '../../service/ipc'

export const useNavigate = () => {
  const [path, setPath] = useState('')
  useEffect(() => {
    const subscription = PZInstanceObservable.subscribe((p) => {
      setPath(p ? p.type : '')
    })
    return () => subscription.unsubscribe()
  })
  return path
}
export const useModalState = () => {
  const [state, setState] = useState(modalObservable.current)

  useEffect(() => {
    const subscription = modalObservable.subscribe((s) => {
      setState(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  return state
}
export const usePZInstance = () => {
  const [instance, setInstance] = useState<PZInstance>()
  useEffect(() => {
    const subscription = PZInstanceObservable.subscribe(setInstance)
    return () => subscription.unsubscribe()
  }, [])

  return instance
}

export const useWindowState = () => {
  const [maximize, setMaximize] = useState(false)
  useEffect(() => {
    invokeIpc('application:inited', undefined).then((p) => {
      setMaximize(p.maximize)
    })
    const subscription = subscribeChannel('window:changed', (v) => {
      if (v === 'maximize') {
        setMaximize(true)
      } else if (v === 'unmaximize') {
        setMaximize(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])
  const toggleMaximize = useCallback(() => {
    sendToChannel('window:operate', 'maximize')
  }, [])

  return [maximize, toggleMaximize] as [boolean, () => void]
}
export const useTheme = (): [string, (theme: Theme) => void] => {
  const [theme, setTheme] = useState('system')
  useEffect(() => {
    invokeIpc('theme:get', undefined).then(setTheme)
    const subscription = subscribeChannel('theme:changed', setTheme)

    return () => subscription.unsubscribe()
  }, [])
  const changeTheme = (val: Theme) => {
    invokeIpc('theme:set', val)
  }

  return [theme, changeTheme]
}
export const usePwBook = () => {
  const [pwbookFile, setPwbookFile] = useState<string>()
  useEffect(() => {
    const subscription = pwbookNotify.subscribe((book) => setPwbookFile(book?.filename))
    return () => subscription.unsubscribe()
  }, [])
  return pwbookFile
}
