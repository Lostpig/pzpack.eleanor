import { PZIndexBuilder, PZVideo, PZSubscription, PZIndexReader, serializeIndex, type BuildProgress } from 'pzpack'
import type { PZPKBuildArgs, PZPKMvBuildArgs, PZLoaderStatus } from '../../lib/declares'
import { invokeIpc, subscribeChannel } from './ipc'
import { getConfig } from './config'

interface PZInstanceBase {
  type: 'builder' | 'mvbuilder' | 'loader' | 'mvloader'
  binding: PZIndexBuilder | PZIndexReader | PZVideo.PZMVIndexBuilder
}
interface PZBuilderInstance extends PZInstanceBase {
  type: 'builder'
  binding: PZIndexBuilder
}
interface PZMVBuilderInstance extends PZInstanceBase {
  type: 'mvbuilder'
  binding: PZVideo.PZMVIndexBuilder
}
interface PZLoaderInstance extends PZInstanceBase {
  type: 'loader' | 'mvloader'
  id: number
  binding: PZIndexReader
  port: number
  status: PZLoaderStatus
}
export type PZInstance = PZBuilderInstance | PZMVBuilderInstance | PZLoaderInstance

const PZInstanceNotify = new PZSubscription.PZBehaviorNotify<PZInstance | undefined>(undefined)
export const PZInstanceObservable = PZInstanceNotify.asObservable()

export const bindingPZloader = async (id: number, port: number, status: PZLoaderStatus) => {
  const idxResult = await invokeIpc('pzpk:getIndex', id)
  if (!idxResult.success) return idxResult
  const indices = new PZIndexReader()
  const idxBuffer = Buffer.from(idxResult.data, idxResult.data.byteOffset, idxResult.data.byteLength)
  indices.decode(idxBuffer, status.version)

  const instType = status.type === 'PZPACK' ? 'loader' : 'mvloader'
  PZInstanceNotify.next({
    type: instType,
    binding: indices,
    id: id,
    port: port,
    status: status,
  })

  return { success: true }
}
export const openPZloader = async (
  filename: string,
  password: string,
): Promise<{ success: boolean; message?: string }> => {
  const result = await invokeIpc('pzpk:open', { filename, password })
  if (!result.success) return result
  return await bindingPZloader(result.id, result.port, result.loaderStatus)
}
export const closePZInstance = async () => {
  const current = PZInstanceNotify.current
  if (current) {
    if (current.type === 'loader' || current.type === 'mvloader') {
      await invokeIpc('pzpk:close', current.id)
    }
    PZInstanceNotify.next(undefined)
  }
}

export type IPCTask<T> = {
  addReporter: (handler: (progress: T) => void) => PZSubscription.Subscription
  complete: Promise<{ canceled: boolean }>
  cancel: () => Promise<void>
}
const createBuildingTask = (id: number) => {
  const addReporter = (handler: (progress: BuildProgress) => void) => {
    return subscribeChannel('pzpk:building', (p) => {
      if (p.id === id) handler(p.progress)
    })
  }
  const complete = new Promise<{ canceled: boolean }>((res) => {
    const subscription = subscribeChannel('pzpk:buildcomplete', (c) => {
      if (c.id === id) {
        subscription.unsubscribe()
        res({ canceled: c.canceled })
      }
    })
  })
  const cancel = async () => {
    await invokeIpc('pzpk:close', id)
  }

  const task: IPCTask<BuildProgress> = {
    addReporter,
    complete,
    cancel,
  }
  return { success: true, task } as { success: true; task: IPCTask<BuildProgress> }
}
export const openPZBuilder = () => {
  const instance = PZInstanceNotify.current
  if (instance && instance.type === 'builder') return
  if (instance) closePZInstance()

  const indexBuilder = new PZIndexBuilder()
  PZInstanceNotify.next({ type: 'builder', binding: indexBuilder })
}
export const startPZBuild = async (
  indexBuilder: PZIndexBuilder,
  target: string,
  description: string,
  password: string,
) => {
  const args: PZPKBuildArgs = {
    type: 'PZPACK',
    options: { target, desc: description, password },
    indexData: serializeIndex(indexBuilder),
  }

  const result = await invokeIpc('pzpk:pack', args)
  if (result.success) {
    return createBuildingTask(result.id)
  } else {
    return result
  }
}

const createMvBuildingTask = (id: number) => {
  const addReporter = (handler: (progress: PZVideo.PZMVProgress) => void) => {
    return subscribeChannel('pzpk:mvbuilding', (p) => {
      if (p.id === id) handler(p.progress)
    })
  }
  const complete = new Promise<{ canceled: boolean }>((res) => {
    const subscription = subscribeChannel('pzpk:buildcomplete', (c) => {
      if (c.id === id) {
        subscription.unsubscribe()
        res({ canceled: c.canceled })
      }
    })
  })
  const cancel = async () => {
    await invokeIpc('pzpk:close', id)
  }

  const task: IPCTask<PZVideo.PZMVProgress> = {
    addReporter,
    complete,
    cancel,
  }
  return { success: true, task } as { success: true; task: IPCTask<PZVideo.PZMVProgress> }
}
export const openPZMVBuilder = () => {
  const instance = PZInstanceNotify.current
  if (instance && instance.type === 'mvbuilder') return
  if (instance) closePZInstance()

  const mvIndexBuilder = new PZVideo.PZMVIndexBuilder()
  PZInstanceNotify.next({ type: 'mvbuilder', binding: mvIndexBuilder })
}
export const startPZMVBuild = async (
  target: string,
  options: Omit<PZVideo.PZMVBuilderOptions, 'ffmpegDir' | 'tempDir'>,
) => {
  const ffmpegDir = await getConfig('ffmpeg')
  const tempDir = await getConfig('tempDir')

  if (!ffmpegDir) throw new Error('ffmpeg not setted')
  if (!tempDir) throw new Error('temp directory not setted')

  const args: PZPKMvBuildArgs = {
    type: 'PZVIDEO',
    target,
    options: {
      password: options.password,
      description: options.description,
      videoCodec: options.videoCodec,
      audioCodec: options.audioCodec,
    },
    indexData: PZVideo.serializeMvIndex(options.indexBuilder),
  }

  const result = await invokeIpc('pzpk:pack', args)
  if (result.success) {
    return createMvBuildingTask(result.id)
  } else {
    return result
  }
}
