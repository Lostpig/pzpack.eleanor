import { ipcMain, type BrowserWindow } from 'electron'
import { PZSubscription } from 'pzpack'
import { appLogger } from './logger'
import type {
  MainChannelReceiver,
  MainChannelSender,
  MainChannelKeys,
  RendererChannelKeys,
  RendererChannelData,
  InvokeChannel,
  InvokeHandler,
} from '../../lib/ipc.channel'

const receiverStore = new Map<MainChannelKeys, PZSubscription.PZSubject<any>>()
const createReciveSubject = (channel: MainChannelKeys) => {
  const subject = new PZSubscription.PZSubject()
  receiverStore.set(channel, subject)
  return subject
}
const getReciveNotify = (channel: MainChannelKeys) => {
  return receiverStore.get(channel)
}
export const getReceiver = <C extends MainChannelKeys>(channel: C): MainChannelReceiver<C> => {
  let receiver = receiverStore.get(channel)
  if (!receiver) {
    receiver = createReciveSubject(channel)
  }
  return receiver.toObservable()
}

type SenderPayload<C extends RendererChannelKeys> = { channel: C; data: RendererChannelData<C> }
const globalSender = new PZSubscription.PZSubject<SenderPayload<any>>()
const senderStore = new Map<RendererChannelKeys, MainChannelSender<any>>()
export const getSender = <C extends RendererChannelKeys>(channel: C): MainChannelSender<C> => {
  let sender = senderStore.get(channel)
  if (!sender) {
    sender = {
      send: (data) => globalSender.next({ channel, data }),
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
    appLogger.info('Ipc message:', channel, arg)
    const notify = getReciveNotify(channel as MainChannelKeys)
    notify?.next(arg)
  })

  globalSender.subscribe((paylod) => {
    mainWindow.webContents.send('renderer-message', paylod)
  })
}

export const registerInvoke = <C extends InvokeChannel>(channel: C, handler: InvokeHandler<C>) => {
  ipcMain.handle(channel, (ev, arg) => {
    if (ENV_DEV) appLogger.debug('Ipc invoke channel:', channel, arg)
    return handler(arg)
  })
}
export const unregisterInvoke = <C extends InvokeChannel>(channel: C) => {
  ipcMain.removeHandler(channel)
}

