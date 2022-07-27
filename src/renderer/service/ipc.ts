import { PZSubscription } from 'pzpack'
import { ipcRenderer } from 'electron/renderer'
import type {
  InvokeRet,
  InvokeChannel,
  InvokeArg,
  MainChannelKeys,
  MainChannelData,
  RendererChannelHandler,
  RendererChannelData,
  RendererChannelKeys,
} from '../../lib/ipc.channel'
import { RendererLogger } from './logger'

const receiverMap = new Map<string, PZSubscription.PZSubject<any>>()
const getReceiver = (key: string) => {
  let receiver = receiverMap.get(key)
  if (!receiver) {
    receiver = new PZSubscription.PZSubject()
    receiverMap.set(key, receiver)
  }

  return receiver
}

type ReceiverPayload<C extends RendererChannelKeys> = { channel: C; data: RendererChannelData<C> }
type SenderPayload<C extends MainChannelKeys> = { channel: C; data: MainChannelData<C> }
const sender = new PZSubscription.PZSubject<SenderPayload<any>>()

const subscribeChannel = <T extends RendererChannelKeys>(channel: T, handler: RendererChannelHandler<T>) => {
  const receiver = getReceiver(channel)
  return receiver.subscribe(handler)
}
const sendToChannel = <T extends MainChannelKeys>(channel: T, data: MainChannelData<T>) => {
  sender.next({ channel, data })
}

const invokeIpc = <T extends InvokeChannel>(channel: T, arg: InvokeArg<T>): Promise<InvokeRet<T>> => {
  return ipcRenderer.invoke(channel, arg)
}

export { subscribeChannel, sendToChannel, invokeIpc }
export const initIpc = () => {
  ipcRenderer.on('renderer-message', (ev, payload: ReceiverPayload<any>) => {
    RendererLogger.debug(`ipc receive from [${payload.channel}]: ${payload.data}`)
    getReceiver(payload.channel).next(payload.data)
  })

  sender.subscribe((payload) => {
    RendererLogger.debug(`ipc send to [${payload.channel}]: ${payload.data}`)
    ipcRenderer.send(payload.channel, payload.data)
  })
}
