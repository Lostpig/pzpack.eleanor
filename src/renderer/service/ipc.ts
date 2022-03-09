import { PZSubscription } from 'pzpack'
import { ipcRenderer } from 'electron/renderer'
import { Channel, ChPayload, ChHandler, ChData, InvokeRet, InvokeChannel, InvokeArg } from '../../lib/ipc.channel'
import { RendererLogger } from './logger'

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

const subscribeChannel = <T extends Channel>(channel: T, handler: ChHandler<T>) => {
  const receiver = getReceiver(channel)
  return receiver.subscribe(handler)
}
const sendToChannel = <T extends Channel>(channel: T, data: ChData<T>) => {
  sender.next({ channel, data })
}
const rendererReady = () => {
  sendToChannel('renderer::ready', null)
}
const invokeIpc = <T extends InvokeChannel>(channel: T, arg: InvokeArg<T>): Promise<InvokeRet<T>> => {
  return ipcRenderer.invoke(channel, arg)
}

export {
  subscribeChannel,
  sendToChannel,
  rendererReady,
  invokeIpc
}
export const initIpc = () => {
  ipcRenderer.on('renderer-message', (ev, payload: ChPayload) => {
    RendererLogger.debug(`ipc receive from [${payload.channel}]: ${payload.data}`)
    getReceiver(payload.channel).next(payload.data)
  })

  sender.subscribe((payload) => {
    RendererLogger.debug(`ipc send to [${payload.channel}]: ${payload.data}`)
    ipcRenderer.send(payload.channel, payload.data)
  })
}


