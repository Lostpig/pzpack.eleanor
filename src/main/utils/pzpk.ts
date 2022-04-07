import {
  OpenPzFile,
  PZSubscription,
  PZBuilder,
  PZVideo,
  getPZPackFileMate,
  PZHelper,
  deserializeIndex,
  type PZLoader,
  type PZTask,
  type BuildProgress,
} from 'pzpack'
import type {
  PZPKOpenResult,
  PZBuildOptions,
  PZMVBuildOptions,
  PZPKIndexResult,
  PZPKPackResult,
} from '../../lib/declares'
import type { PasswordBook } from './pwbook'
import { config } from './config'
import { getSender } from './ipc'
import { AppLogger } from './logger'
import { instance as pzServer } from './pzpk.server'

const serverPort = 42506

interface PZContext {
  state: 'building' | 'mvbuilding' | 'explorer'
  hash: string
  instance: PZTask.AsyncTask<BuildProgress> | PZTask.AsyncTask<PZVideo.PZMVProgress> | PZLoader
}
interface PZContextBuilding extends PZContext {
  state: 'building'
  instance: PZTask.AsyncTask<BuildProgress>
}
interface PZContextMVBuilding extends PZContext {
  state: 'mvbuilding'
  instance: PZTask.AsyncTask<PZVideo.PZMVProgress>
}
interface PZContextExplorer extends PZContext {
  state: 'explorer'
  instance: PZLoader
}
type PZContexts = PZContextBuilding | PZContextMVBuilding | PZContextExplorer

const PZInstanceNotify = new PZSubscription.PZBehaviorNotify<PZContexts | undefined>(undefined)

const closeInstance = (context: PZContexts) => {
  if (context.state === 'explorer') {
    context.instance.close()
  } else {
    context.instance.cancel()
  }
}
const pushPZLoader = (hash: string, loader: PZLoader) => {
  pzServer.binding(hash, loader)
  PZInstanceNotify.next({ state: 'explorer', hash, instance: loader })
}

export const openPZloader = async (file: string, password: string | Buffer): Promise<PZPKOpenResult> => {
  const context = PZInstanceNotify.current
  let loader: PZLoader | undefined

  try {
    if (context && context.state === 'explorer') {
      if (file === context.instance.filename) return { success: false, message: 'already opened file' }
    }

    loader = OpenPzFile(file, password)
    const hashData = Buffer.concat([loader.loadIndexBuffer(), Buffer.from(file, 'utf-8')])
    const hash = PZHelper.sha256Hex(hashData)

    if (context) closeInstance(context)
    pushPZLoader(hash, loader)
    await pzServer.start(serverPort)

    return {
      success: true,
      hash,
      port: serverPort,
      loaderStatus: {
        filename: loader.filename,
        version: loader.version,
        description: loader.getDescription(),
        type: loader.type,
        size: loader.size,
      },
    }
  } catch (err) {
    AppLogger.errorStack(err)
    if (loader) {
      loader.close()
    }

    return { success: false, message: (err as Error).message }
  }
}
export const tryOpenPZloader = (file: string, book: PasswordBook): Promise<PZPKOpenResult> | PZPKOpenResult => {
  const context = PZInstanceNotify.current
  if (context && context.state === 'explorer') {
    if (file === context.instance.filename) return { success: false, message: 'already opened file' }
  }

  const matedata = getPZPackFileMate(file)
  if (book.has(matedata.pwHash)) {
    const pwr = book.get(matedata.pwHash)!
    return openPZloader(file, pwr.key)
  } else {
    return { success: false, message: 'no matching password' }
  }
}
export const loadIndexData = (hash: string): PZPKIndexResult => {
  const context = PZInstanceNotify.current
  if (context?.state === 'explorer' && context.hash === hash) {
    const loader = context.instance
    const idxBuf = loader.loadIndexBuffer()

    return { success: true, data: idxBuf }
  } else {
    return { success: false, message: 'load index failed' }
  }
}

export const closePZInstance = (hash: string) => {
  const current = PZInstanceNotify.current

  if (current && current.hash === hash) {
    closeInstance(current)
    PZInstanceNotify.next(undefined)
  }
}
export const startPZBuild = (indexData: string, options: PZBuildOptions): PZPKPackResult => {
  const indexBuilder = deserializeIndex(indexData)
  const builder = new PZBuilder({
    type: 'PZPACK',
    indexBuilder,
    password: options.password,
  })
  builder.setDescription(options.desc)

  const hash = PZHelper.sha256Hex(indexData)
  const task = builder.buildTo(options.target)

  const sender = getSender('pzpk:building')
  const completer = getSender('pzpk:buildcomplete')
  task.addReporter((p) => sender.send({ hash, progress: p }))
  task.complete.then((p) => {
    completer.send({ hash, canceled: p.isCanceled })
  })

  return { success: true, hash }
}
export const startPZMVBuild = (target: string, indexData: string, options: PZMVBuildOptions): PZPKPackResult => {
  const ffmpegDir = config.get('ffmpeg')
  const tempDir = config.get('tempDir')

  if (!ffmpegDir) throw new Error('ffmpeg not setted')
  if (!tempDir) throw new Error('temp directory not setted')

  const indexBuilder = PZVideo.deserializeMvIndex(indexData)
  const builder = new PZVideo.PZMVBuilder({ indexBuilder, ffmpegDir, tempDir, ...options })

  const hash = PZHelper.sha256Hex(indexData)
  const task = builder.buildTo(target)

  const sender = getSender('pzpk:mvbuilding')
  const completer = getSender('pzpk:buildcomplete')
  task.addReporter((p) => sender.send({ hash, progress: p }))
  task.complete.then((p) => {
    completer.send({ hash, canceled: p.isCanceled })
  })

  return { success: true, hash }
}
