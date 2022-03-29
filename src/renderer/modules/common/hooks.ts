import { useEffect, useMemo, useState, useCallback } from 'react'
import type { PZVideo } from 'pzpack'
import { FirstLetterUpper } from '../../utils'
import type { PackageInfo, Theme } from '../../../lib/declares'
import { openFile, saveFile, openDir, selectFiles, selectVideos, saveVideo } from '../../service/io'
import { modalObservable, openModal, closeModal } from '../../service/modal'
import { setConfig, getConfig, checkFfmpeg, checkExternalPalyer } from '../../service/config'
import {
  openPZloader,
  closePZInstance,
  openPZBuilder,
  openPZMVBuilder,
  PZInstanceObservable,
  type PZInstance,
} from '../../service/pzpack'
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
export const useIoService = () => {
  return useMemo(() => {
    return { openFile, saveFile, openDir, selectFiles, selectVideos, saveVideo }
  }, [])
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
export const useModalManager = () => {
  return useMemo(() => {
    return { openModal, closeModal }
  }, [])
}

export const usePZInstance = () => {
  const [instance, setInstance] = useState<PZInstance>()
  useEffect(() => {
    const subscription = PZInstanceObservable.subscribe(setInstance)
    return () => subscription.unsubscribe()
  }, [])

  return instance
}
export const usePZPackService = () => {
  return useMemo(() => {
    return { openPZloader, closePZInstance, openPZBuilder, openPZMVBuilder }
  }, [])
}

export const useWindowState = () => {
  const [maximize, setMaximize] = useState(false)
  useEffect(() => {
    const subscription = subscribeChannel('window::changed', (v) => {
      if (v === 'maximize') {
        setMaximize(true)
      } else if (v === 'unmaximize') {
        setMaximize(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])
  const toggleMaximize = useCallback(() => {
    sendToChannel('window::operate', 'maximize')
  }, [])

  return [maximize, toggleMaximize] as [boolean, () => void]
}
export const useWindowOperate = () => {
  const close = useCallback(() => {
    sendToChannel('window::operate', 'close')
  }, [])
  const minimize = useCallback(() => {
    sendToChannel('window::operate', 'minimize')
  }, [])

  return { close, minimize }
}

export const usePackage = () => {
  const [pkg, setPkg] = useState<PackageInfo>()
  useEffect(() => {
    invokeIpc('req:package', undefined).then((val) => {
      val.name = FirstLetterUpper(val.name)
      setPkg(val)
    })
  }, [])

  return pkg
}
export const useTheme = (): [string, (theme: Theme) => void] => {
  const [theme, setTheme] = useState('system')
  useEffect(() => {
    invokeIpc('req:theme', undefined).then(setTheme)
    subscribeChannel('theme::setted', setTheme)
  }, [])
  const changeTheme = (val: Theme) => {
    sendToChannel('theme::set', val)
  }

  return [theme, changeTheme]
}

export const useConfig = () => {
  return useMemo(() => {
    return { setConfig, getConfig, checkFfmpeg, checkExternalPalyer }
  }, [])
}
export const useExternalPlayer = () => {
  const openExternalPlayer = useCallback((url: string, server: PZVideo.PZMVSimpleServer) => {
    if (!server.running) server.start()
    sendToChannel('exec::player', url)
  }, [])
  const checkExternalPlayer = useCallback(() => {
    return getConfig('externalPlayer').then((val) => {
      return !!val
    })
  }, [])

  return { openExternalPlayer, checkExternalPlayer }
}
