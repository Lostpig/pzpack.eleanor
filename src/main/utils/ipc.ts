import { ipcMain, type BrowserWindow } from 'electron'
import { PZSubscription } from 'pzpack'
import { AppLogger } from './logger'
import type {
  MainChannelReceiver,
  MainChannelSender,
  MainChannelKeys,
  RendererChannelKeys,
  RendererChannelData,
  InvokeChannel,
  InvokeHandler
} from '../../lib/ipc.channel'

const receiverStore = new Map<MainChannelKeys, PZSubscription.PZNotify<any>>()
const createReciveNotify = (channel: MainChannelKeys) => {
  const notify = new PZSubscription.PZNotify()
  receiverStore.set(channel, notify)
  return notify
}
const getReciveNotify = (channel: MainChannelKeys) => {
  return receiverStore.get(channel)
}
export const getReceiver = <C extends MainChannelKeys>(channel: C): MainChannelReceiver<C> => {
  let receiver = receiverStore.get(channel)
  if (!receiver) {
    receiver = createReciveNotify(channel)
  }
  return receiver.asObservable()
}

type SenderPayload<C extends RendererChannelKeys> = { channel: C, data: RendererChannelData<C> }
const globalSender = new PZSubscription.PZNotify<SenderPayload<any>>()
const senderStore = new Map<RendererChannelKeys, MainChannelSender<any>>()
export const getSender = <C extends RendererChannelKeys>(channel: C): MainChannelSender<C> => {
  let sender = senderStore.get(channel)
  if (!sender) {
    sender = {
      send: (data) => globalSender.next({ channel, data })
    }
    senderStore.set(channel, sender)
  }

  return sender
}

/**
 * just call by app window
 */
export const registerMainWindow = (mainWindow: BrowserWindow) => {
  mainWindow.webContents.on('ipc-message', (ev, channel, arg) => {
    AppLogger.info('Ipc message:', channel, arg)
    const notify = getReciveNotify(channel as MainChannelKeys)
    notify?.next(arg)
  })

  globalSender.subscribe((paylod) => {
    mainWindow.webContents.send('renderer-message', paylod)
  })
}

export const registerInvoke = <C extends InvokeChannel>(channel: C, handler: InvokeHandler<C>) => {
  ipcMain.handle(channel, (ev, arg) => {
    return handler(arg)
  })
}
export const unregisterInvoke = <C extends InvokeChannel>(channel: C) => {
  ipcMain.removeHandler(channel)
}
