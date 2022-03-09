import { BrowserWindow, ipcMain } from 'electron'
import { PZSubscription } from 'pzpack'
import { AppLogger } from './logger'
import { Channel, ChHandler, ChPayload, ChData, InvokeChannel, InvokeHandler } from '../lib/ipc.channel'

const receiverMap = new Map<string, PZSubscription.PZNotify<any>>()
const getReceiver = (key: string) => {
  let receiver = receiverMap.get(key)
  if (!receiver) {
    receiver = new PZSubscription.PZNotify()
    receiverMap.set(key, receiver)
  }

  return receiver
}
const sender = new PZSubscription.PZNotify<ChPayload>()

export const subscribeChannel = <T extends Channel>(channel: T, handler: ChHandler<T>) => {
  const receiver = getReceiver(channel)
  return receiver.subscribe(handler)
}
export const sendToChannel = <T extends Channel>(channel: T, data: ChData<T>) => {
  sender.next({ channel, data })
}

/**
 * just call by app window
 */
export const registerMainWindow = (mainWindow: BrowserWindow) => {
  mainWindow.webContents.on('ipc-message', (ev, channel, arg) => {
    AppLogger.info('Ipc message:', channel, arg)
    const notify = getReceiver(channel)
    notify.next(arg)
  })

  sender.subscribe((paylod) => {
    mainWindow.webContents.send('renderer-message', paylod)
  })
}

export const registerInvoke = <C extends InvokeChannel>(channel: C, handler: InvokeHandler<C>) => {
  ipcMain.handle(channel, (ev, arg) => {
    return handler(arg)
  })
}
