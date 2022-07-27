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
  hash: string
  binding: PZIndexReader
  port: number
  status: PZLoaderStatus
}
export type PZInstance = PZBuilderInstance | PZMVBuilderInstance | PZLoaderInstance

const PZInstanceNotify = new PZSubscription.PZBehaviorSubject<PZInstance | undefined>(undefined)
export const PZInstanceObservable = PZInstanceNotify.asObservable()

export const bindingPZloader = async (hash: string, port: number, status: PZLoaderStatus) => {
  const idxResult = await invokeIpc('pzpk:getIndex', hash)
  if (!idxResult.success) return idxResult
  const indices = new PZIndexReader()
  const idxBuffer = Buffer.from(idxResult.data, idxResult.data.byteOffset, idxResult.data.byteLength)
  indices.decode(idxBuffer, status.version)

  const instType = status.type === 'PZPACK' ? 'loader' : 'mvloader'
  PZInstanceNotify.next({
    type: instType,
    binding: indices,
    hash,
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
  return await bindingPZloader(result.hash, result.port, result.loaderStatus)
}
export const closePZInstance = async () => {
  const current = PZInstanceNotify.current
  if (current) {
    if (current.type === 'loader' || current.type === 'mvloader') {
      await invokeIpc('pzpk:close', current.hash)
    }
    PZInstanceNotify.next(undefined)
  }
}

export type IPCTask<T> = {
  observable: PZSubscription.PZObservable<T>
  readonly canceled: boolean
  cancel: () => Promise<void>
}
export type IPCTaskCreateSuccessResult<T> = {
  success: true,
  task: IPCTask<T>
}

const createBuildingTask = (hash: string): IPCTaskCreateSuccessResult<BuildProgress> => {
  const subject = new PZSubscription.PZSubject<BuildProgress>()
  let canceled = false

  const subscriptions = [
    subscribeChannel('pzpk:building', (p) => {
      if (p.hash === hash) subject.next(p.progress)
    }),
    subscribeChannel('pzpk:buildcomplete', (p) => {
      if (p.hash === hash) {
        canceled = p.canceled
        subject.complete()
      }
    }),
    subscribeChannel('pzpk:builderror', (p) => {
      if (p.hash === hash) {
        subject.error(new Error(p.error))
      }
    }),
  ]
  subject.subscribe(
    undefined,
    () => {
      subscriptions.forEach((s) => s.unsubscribe())
    },
    () => {
      subscriptions.forEach((s) => s.unsubscribe())
    },
  )
  const cancel = async () => {
    await invokeIpc('pzpk:close', hash)
  }

  const task: IPCTask<BuildProgress> = {
    observable: subject.asObservable(),
    cancel,
    get canceled () {
      return canceled
    }
  }
  return { success: true, task }
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
    return createBuildingTask(result.hash)
  } else {
    return result
  }
}

const createMvBuildingTask = (hash: string): IPCTaskCreateSuccessResult<PZVideo.PZMVProgress> => {
  const subject = new PZSubscription.PZSubject<PZVideo.PZMVProgress>()
  let canceled = false

  const subscriptions = [
    subscribeChannel('pzpk:mvbuilding', (p) => {
      if (p.hash === hash) subject.next(p.progress)
    }),
    subscribeChannel('pzpk:buildcomplete', (p) => {
      if (p.hash === hash) {
        canceled = p.canceled
        subject.complete()
      }
    }),
    subscribeChannel('pzpk:builderror', (p) => {
      if (p.hash === hash) {
        subject.error(new Error(p.error))
      }
    }),
  ]
  subject.subscribe(
    undefined,
    () => {
      subscriptions.forEach((s) => s.unsubscribe())
    },
    () => {
      subscriptions.forEach((s) => s.unsubscribe())
    },
  )

  const cancel = async () => {
    await invokeIpc('pzpk:close', hash)
  }
  const task: IPCTask<PZVideo.PZMVProgress> = {
    observable: subject.asObservable(),
    cancel,
    get canceled () {
      return canceled
    }
  }
  return { success: true, task }
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
    return createMvBuildingTask(result.hash)
  } else {
    return result
  }
}
