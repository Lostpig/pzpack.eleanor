import {
  OpenPzFile,
  PZSubscription,
  PZBuilder,
  PZVideo,
  getPZPackFileMate,
  type PZLoader,
  type PZIndexBuilder,
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

const idCounter = (() => {
  let i = 1
  return () => i++
})()

interface PZContext {
  state: 'building' | 'mvbuilding' | 'explorer'
  id: number
  instance: PZTask.AsyncTask<BuildProgress> | PZTask.AsyncTask<PZVideo.PZMVProgress> | PZVideo.PZMVSimpleServer
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
  instance: PZVideo.PZMVSimpleServer
}
type PZContexts = PZContextBuilding | PZContextMVBuilding | PZContextExplorer

const PZInstanceNotify = new PZSubscription.PZBehaviorNotify<PZContexts | undefined>(undefined)

const closeInstance = (context: PZContexts) => {
  if (context.state === 'explorer') {
    context.instance.close()
    context.instance.loader.close()
  } else {
    context.instance.cancel()
  }
}
const pushPZLoader = (id: number, loader: PZLoader) => {
  const server = new PZVideo.PZMVSimpleServer(loader)
  PZInstanceNotify.next({ state: 'explorer', id, instance: server })
  return server
}

export const openPZloader = (file: string, password: string | Buffer): PZPKOpenResult => {
  const context = PZInstanceNotify.current
  let loader: PZLoader | undefined

  try {
    if (context && context.state === 'explorer') {
      if (file === context.instance.loader.filename) return { success: false, message: 'already opened file' }
    }

    const id = idCounter()
    loader = OpenPzFile(file, password)
    if (context) closeInstance(context)
    const server = pushPZLoader(id, loader)
    server.start()

    return {
      success: true,
      id,
      port: server.port,
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
export const tryOpenPZloader = (file: string, book: PasswordBook): PZPKOpenResult => {
  const context = PZInstanceNotify.current
  if (context && context.state === 'explorer') {
    if (file === context.instance.loader.filename) return { success: false, message: 'already opened file' }
  }

  const matedata = getPZPackFileMate(file)
  if (book.has(matedata.pwHash)) {
    const pwr = book.get(matedata.pwHash)!
    return openPZloader(file, pwr.key)
  } else {
    return { success: false, message: 'no matching password' }
  }
}
export const loadIndexData = (id: number): PZPKIndexResult => {
  const context = PZInstanceNotify.current
  if (context?.state === 'explorer' && context.id === id) {
    const loader = context.instance.loader
    const idxBuf = loader.loadIndexBuffer()

    return { success: true, data: idxBuf }
  } else {
    return { success: false, message: 'load index failed' }
  }
}

export const closePZInstance = (id: number) => {
  const current = PZInstanceNotify.current

  if (current && current.id === id) {
    closeInstance(current)
    PZInstanceNotify.next(undefined)
  }
}
export const startPZBuild = (indexBuilder: PZIndexBuilder, options: PZBuildOptions): PZPKPackResult => {
  const builder = new PZBuilder({
    type: 'PZPACK',
    indexBuilder,
    password: options.password,
  })
  builder.setDescription(options.desc)

  const task = builder.buildTo(options.target)
  const id = idCounter()

  const sender = getSender('pzpk:building')
  const completer = getSender('pzpk:buildcomplete')
  task.addReporter((p) => sender.send({ id, progress: p }))
  task.complete.then((p) => {
    completer.send({ id, canceled: p.isCanceled })
  })

  return { success: true, id }
}
export const startPZMVBuild = (
  target: string,
  indexBuilder: PZVideo.PZMVIndexBuilder,
  options: PZMVBuildOptions,
): PZPKPackResult => {
  const ffmpegDir = config.get('ffmpeg')
  const tempDir = config.get('tempDir')

  if (!ffmpegDir) throw new Error('ffmpeg not setted')
  if (!tempDir) throw new Error('temp directory not setted')

  const builder = new PZVideo.PZMVBuilder({ indexBuilder, ffmpegDir, tempDir, ...options })
  const task = builder.buildTo(target)
  const id = idCounter()

  const sender = getSender('pzpk:mvbuilding')
  const completer = getSender('pzpk:buildcomplete')
  task.addReporter((p) => sender.send({ id, progress: p }))
  task.complete.then((p) => {
    completer.send({ id, canceled: p.isCanceled })
  })

  return { success: true, id }
}
