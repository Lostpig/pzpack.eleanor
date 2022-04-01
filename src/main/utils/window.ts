import { BrowserWindow, app } from 'electron'
import { AppLogger } from './logger'
import { EntryPage } from './common'
import { config } from './config'
import type { MainChannelData } from '../../lib/ipc.channel'
import { registerMainWindow, getReceiver, getSender } from './ipc'

let singleInstance: WindowManager
class WindowManager {
  private main?: BrowserWindow
  get window() {
    return this.main
  }
  private visibility = false
  constructor() {
    if (singleInstance) return singleInstance

    singleInstance = this
    return singleInstance
  }
  start() {
    this.initMainWindow()
    this.setSingleInstance()
  }
  resume() {
    if (!this.main) {
      this.initMainWindow()
    }
  }
  private setSingleInstance() {
    // Single instance
    const getLock = app.requestSingleInstanceLock()

    if (!getLock) {
      AppLogger.error('Another instance is running, exiting')
      app.quit()
    } else {
      app.on('second-instance', () => {
        if (this.main) {
          if (this.main.isMinimized()) {
            this.main.restore()
          }
          this.main.focus()
        }
      })
    }
  }
  private initMainWindow() {
    this.main = new BrowserWindow({
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
      transparent: process.platform === 'darwin',
      minWidth: 900,
      minHeight: 600,
      frame: false,
      enableLargerThanScreen: false,
      maximizable: true,
      fullscreenable: true,
      backgroundColor: '#00000000',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    })
    const current = this.main

    const show = current.show
    current.show = () => {
      if (current.isMinimized()) {
        current.restore()
      } else {
        show.call(current)
      }
    }

    current.on('closed', () => {
      this.main = undefined
    })
    current.on('ready-to-show', () => {
      if (process.platform === 'win32') {
        // current.setMenu(null)
        current.removeMenu()
        current.minimize()
        current.restore()
      }
    })

    current.loadURL(EntryPage)
    if (config.get('maximizi') === true) {
      current.maximize()
    }

    this.initWindowOperate()

    AppLogger.info('Main window inited')
  }
  private initWindowOperate() {
    registerMainWindow(this.main!)

    const operates: Record<MainChannelData<'window:operate'>, () => void> = {
      close: () => this.close(),
      hidden: () => this.hide(),
      maximize: () => this.toggleMaximize(),
      minimize: () => this.window?.minimize(),
      visibility: () => this.toggleVisibility(),
    }
    getReceiver('window:operate').subscribe((p) => {
      operates[p]()
    })
    const sender = getSender('window:changed')

    this.window?.on('minimize', () => {
      sender.send('minimize')
    })
    this.window?.on('maximize', () => {
      config.set('maximizi', true)
      sender.send('maximize')
    })
    this.window?.on('unmaximize', () => {
      config.set('maximizi', false)
      sender.send('unmaximize')
    })
    this.window?.on('restore', () => {
      sender.send('restore')
    })
  }

  show() {
    if (!this.main) return

    this.main.show()
    this.visibility = true
  }
  hide() {
    if (!this.main) return

    this.main.hide()
    this.visibility = false
  }
  toggleVisibility() {
    if (this.visibility) {
      this.hide()
    } else {
      this.show()
    }
  }
  toggleMaximize() {
    if (this.main?.isMaximized()) {
      this.main.unmaximize()
    } else {
      this.main?.maximize()
    }
  }
  fullScreen(flag: boolean) {
    if (!this.main) return

    this.main.setFullScreen(flag)
    config.set('fullscreen', flag)
  }
  openDevTool() {
    if (!this.main) return
    this.main.webContents.openDevTools({ mode: 'detach' })
  }
  reload() {
    if (!this.main) return
    this.main.reload()
  }

  close() {
    this.main?.close()
  }
}

export const appWindow = new WindowManager()
