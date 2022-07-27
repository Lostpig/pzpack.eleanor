import { useEffect, useMemo, useState, useCallback } from 'react'
import { FirstLetterUpper } from '../../utils'
import type { PackageInfo, Theme } from '../../../lib/declares'
import { getInfo } from '../../service/global'
import { modalObservable } from '../../service/modal'
import { getConfig } from '../../service/config'
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
export const useWindowOperate = () => {
  const close = useCallback(() => {
    sendToChannel('window:operate', 'close')
  }, [])
  const minimize = useCallback(() => {
    sendToChannel('window:operate', 'minimize')
  }, [])

  return { close, minimize }
}

export const usePackage = () => {
  const pkg: PackageInfo = useMemo(() => {
    const globalInfo = getInfo()
    return { ...globalInfo.pkgInfo, name: FirstLetterUpper(globalInfo.pkgInfo.name) }
  }, [])
  return pkg
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

export const useExternalPlayer = () => {
  const openExternalPlayer = useCallback((url: string) => {
    sendToChannel('exec:explayer', { url })
  }, [])
  const checkExternalPlayer = useCallback(() => {
    return getConfig('externalPlayer').then((val) => {
      return !!val
    })
  }, [])

  return { openExternalPlayer, checkExternalPlayer }
}
export const usePwBook = () => {
  const [pwbookFile, setPwbookFile] = useState<string>()
  useEffect(() => {
    const subscription = pwbookNotify.subscribe((book) => setPwbookFile(book?.filename))
    return () => subscription.unsubscribe()
  }, [])
  return pwbookFile
}
