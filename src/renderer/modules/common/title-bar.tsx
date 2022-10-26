import * as path from 'path'
import React, { useReducer, createContext, useMemo, useContext, type PropsWithChildren, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MinimizeIcon, MaximizeIcon, WindowizeIcon, CloseIcon, MenuIcon } from '../icons'
import { mergeCls, lazyValue, FirstLetterUpper } from '../../utils'
import { useWindowState, useTheme, usePZInstance, usePwBook } from './hooks'
import { openSettingDialog } from './setting-dialog'
import { openPwbookDialog, openPwbookEditDialog } from './pwbook-dialogs'
import { openConfirmDialog } from './dialogs'
import { openOpenFileDialog } from './open-dialog'
import { closePasswordBook } from '../../service/pwbook'
import { closePZInstance, openPZBuilder } from '../../service/pzpack'
import { sendToChannel } from '../../service/ipc'
import { getInfo, clearCache } from '../../service/global'

const packageInfo = lazyValue(() => {
  const globalInfo = getInfo()
  return { ...globalInfo.pkgInfo, name: FirstLetterUpper(globalInfo.pkgInfo.name) }
})

type TitleBarContext = {
  toggleMenu: (patch?: boolean) => void
}
const TitleBarCtx = createContext<TitleBarContext>({ toggleMenu: () => {} })

const TitleBarIcon: React.FC<PropsWithChildren<React.DOMAttributes<HTMLDivElement>>> = (props) => {
  return (
    <div
      onClick={props.onClick}
      className={mergeCls(
        'w-8 h-8 flex justify-center items-center electron-nodrag',
        'text-black hover:bg-gray-300 dark:text-gray-50 dark:hover:bg-neutral-600',
      )}
    >
      {props.children}
    </div>
  )
}
const TitleContent: React.FC = () => {
  return (
    <div className="flex-1 text-center select-none">
      <span className="inline-block align-middle">
        {packageInfo.value?.name ?? 'Eleanor'} {packageInfo.value?.version ?? ''}
      </span>
    </div>
  )
}

const closeWindow = () => {
  sendToChannel('window:operate', 'close')
}
const minimizeWindow = () => {
  sendToChannel('window:operate', 'minimize')
}
const CloseButton = () => {
  return (
    <TitleBarIcon onClick={closeWindow}>
      <CloseIcon size={10} />
    </TitleBarIcon>
  )
}
const MinimizeButton = () => {
  return (
    <TitleBarIcon onClick={minimizeWindow}>
      <MinimizeIcon size={10} />
    </TitleBarIcon>
  )
}
const MaximizeButton = () => {
  const [maximize, toggleMaximize] = useWindowState()

  return (
    <TitleBarIcon onClick={() => toggleMaximize()}>
      {maximize ? <WindowizeIcon size={10} /> : <MaximizeIcon size={10} />}
    </TitleBarIcon>
  )
}
const MainButton = () => {
  const ctx = useContext(TitleBarCtx)

  return (
    <TitleBarIcon onClick={() => ctx.toggleMenu()}>
      <MenuIcon size={20} />
    </TitleBarIcon>
  )
}

type TitleMenuItemProps = {
  disabled?: boolean
  selected?: boolean
  onActive?: () => void
  text: string
}
const TitleMenuSeparator: React.FC = () => {
  return (
    <div className="px-2 py-1 box-border">
      <span className="block w-full h-px bg-gray-300 dark:bg-neutral-500"></span>
    </div>
  )
}
const TitleMenuItem: React.FC<PropsWithChildren<TitleMenuItemProps>> = (props) => {
  const ctx = useContext(TitleBarCtx)
  const disabled = !!props.disabled
  const activeHandler: React.MouseEventHandler = (ev) => {
    ev.preventDefault()
    ev.stopPropagation()

    if (!disabled && !props.children) {
      ctx.toggleMenu(false)
      if (props.onActive) props.onActive()
    }
  }

  return (
    <div
      className={mergeCls(
        'px-7 py-2  w-52 select-none',
        disabled ? 'text-gray-400 hover:bg-transparent' : 'hover:bg-gray-200 dark:hover:bg-neutral-600',
        props.children ? 'submenu-holder' : false,
      )}
      onClick={activeHandler}
    >
      {props.selected ? <span>*</span> : null}
      <span>{props.text}</span>
      {props.children}
    </div>
  )
}
const SubMenu: React.FC = (props) => {
  return (
    <div
      className={mergeCls(
        'submenu absolute top-0 left-full',
        'bg-white shadow-md text-black pt-0 pb-1 text-sm',
        'dark:bg-neutral-700 dark:text-gray-50',
      )}
    >
      {props.children}
    </div>
  )
}
const ThemeSubMenu = () => {
  const [t] = useTranslation()
  const [theme, setTheme] = useTheme()

  return (
    <SubMenu>
      <TitleMenuItem text={t('dark theme')} selected={theme === 'dark'} onActive={() => setTheme('dark')} />
      <TitleMenuItem text={t('light theme')} selected={theme === 'light'} onActive={() => setTheme('light')} />
      <TitleMenuItem text={t('system theme')} selected={theme === 'system'} onActive={() => setTheme('system')} />
    </SubMenu>
  )
}

const PWBookSubMenu = () => {
  const [t] = useTranslation()
  const pwbFile = usePwBook()
  const fname = useMemo(() => {
    return pwbFile ? path.basename(pwbFile) : ''
  }, [pwbFile])

  const openPwBook = useCallback(
    async (mode: 'open' | 'create') => {
      const res = await openPwbookDialog(mode)
      if (res) {
        res.subscribe((f) => {
          if (f) openPwbookEditDialog()
        })
      }
    },
    [],
  )

  return (
    <SubMenu>
      {pwbFile ? (
        <>
          <TitleMenuItem text={fname} onActive={openPwbookEditDialog} />
          <TitleMenuSeparator />
        </>
      ) : null}
      <TitleMenuItem text={t('open pwbook')} onActive={() => openPwBook('open')} />
      <TitleMenuItem text={t('create pwbook')} onActive={() => openPwBook('create')} />
      <TitleMenuItem text={t('close pwbook')} disabled={!pwbFile} onActive={closePasswordBook} />
    </SubMenu>
  )
}

const TitleMenu = (props: { hidden: boolean }) => {
  const { hidden } = props
  const [t] = useTranslation()
  const instance = usePZInstance()
  const opened = useMemo(() => instance !== undefined, [instance])
  const openBuilder = useCallback(() => {
    if (instance && instance.type !== 'builder') {
      const ob = openConfirmDialog(t('has opened doc alert'), t('warning'))
      ob.subscribe((ok) => {
        if (ok === 'ok') openPZBuilder()
      })
    } else {
      openPZBuilder()
    }
  }, [instance])

  return (
    <div
      className={mergeCls(
        'fixed top-8 left-0 bg-white shadow-md text-black py-1 text-sm',
        'dark:bg-neutral-700 dark:text-gray-50',
        hidden && 'hidden',
      )}
    >
      <TitleMenuItem text={t('open')} onActive={openOpenFileDialog} />
      <TitleMenuItem text={t('create')} onActive={openBuilder} />
      <TitleMenuItem text={t('close')} disabled={!opened} onActive={closePZInstance} />
      <TitleMenuSeparator />
      <TitleMenuItem text={t('setting')} onActive={openSettingDialog} />
      <TitleMenuItem text={t('theme')}>
        <ThemeSubMenu />
      </TitleMenuItem>
      <TitleMenuItem text={t('password book')}>
        <PWBookSubMenu />
      </TitleMenuItem>
      <TitleMenuSeparator />
      <TitleMenuItem disabled text={t('help')} />
      <TitleMenuItem disabled text={t('about')} />
      <TitleMenuItem text={t('clear cache')} onActive={clearCache} />
      <TitleMenuSeparator />
      <TitleMenuItem text={t('exit')} onActive={closeWindow} />
    </div>
  )
}

export const TitleBar = () => {
  const [menuVisible, menuVisDispatch] = useReducer((prev: boolean, patch?: boolean) => {
    if (patch !== undefined) return patch
    return !prev
  }, false)
  const ctx = useMemo(() => {
    return { toggleMenu: menuVisDispatch }
  }, [menuVisDispatch])

  return (
    <>
      <TitleBarCtx.Provider value={ctx}>
        <div className="flex h-8 bg-gray-200 dark:bg-neutral-700 text-black dark:text-gray-50 electron-drag">
          <MainButton />
          <TitleContent />
          <MinimizeButton />
          <MaximizeButton />
          <CloseButton />
          <TitleMenu hidden={!menuVisible} />
        </div>
      </TitleBarCtx.Provider>
    </>
  )
}
