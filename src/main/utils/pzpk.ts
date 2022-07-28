import {
  OpenPzFile,
  PZBuilder,
  PZVideo,
  getPZPackFileMate,
  PZHelper,
  deserializeIndex,
  type PZLoader,
  type PZTask,
  type BuildProgress,
  type ExtractProgress,
} from 'pzpack'
import type {
  PZPKOpenResult,
  PZBuildOptions,
  PZMVBuildOptions,
  PZPKIndexResult,
  PZPKPackResult,
  PZExtractArgs,
} from '../../lib/declares'
import type { PasswordBook } from './pwbook'
import { config } from './config'
import { getSender } from './ipc'
import { AppLogger } from './logger'
import { instance as pzServer } from './pzpk.server'

const serverPort = 42506

type UsableTask =
  | PZTask.AsyncTask<BuildProgress>
  | PZTask.AsyncTask<PZVideo.PZMVProgress>
  | PZTask.AsyncTask<ExtractProgress>
interface PZContext {
  loader?: {
    hash: string
    instance: PZLoader
  }
  task?: {
    hash: string
    instance: UsableTask
  }
}
const runningContext: PZContext = {}
const closeLoader = () => {
  if (runningContext.loader) {
    runningContext.loader.instance.close()
    runningContext.loader = undefined
  }
}
const bindLoader = (hash: string, loader: PZLoader) => {
  closeLoader()

  pzServer.binding(hash, loader)
  runningContext.loader = { hash, instance: loader }
}

const closeTask = () => {
  if (runningContext.task) {
    runningContext.task.instance.cancel()
    runningContext.task = undefined
  }
}
const bindTask = (hash: string, task: UsableTask) => {
  closeTask()
  runningContext.task = { hash, instance: task }
}

export const openPZloader = async (file: string, password: string | Buffer): Promise<PZPKOpenResult> => {
  let loader: PZLoader | undefined

  try {
    if (file === runningContext.loader?.instance.filename) return { success: false, message: 'already opened file' }

    loader = OpenPzFile(file, password)
    const hashData = Buffer.concat([loader.loadIndexBuffer(), Buffer.from(file, 'utf-8')])
    const hash = PZHelper.sha256Hex(hashData)

    bindLoader(hash, loader)
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
  if (file === runningContext.loader?.instance.filename) return { success: false, message: 'already opened file' }

  const matedata = getPZPackFileMate(file)
  if (book.has(matedata.pwHash)) {
    const pwr = book.get(matedata.pwHash)!
    return openPZloader(file, pwr.key)
  } else {
    return { success: false, message: 'no matching password' }
  }
}
export const closePZloader = (hash: string) => {
  if (hash === runningContext.loader?.hash) {
    closeLoader()
  }
}
export const loadIndexData = (hash: string): PZPKIndexResult => {
  const loader = runningContext.loader
  if (loader?.hash === hash) {
    const idxBuf = loader.instance.loadIndexBuffer()
    return { success: true, data: idxBuf }
  } else {
    return { success: false, message: 'load index failed' }
  }
}

export const startExtract = (args: PZExtractArgs): PZPKPackResult => {
  const loader = runningContext.loader
  if (loader?.hash === args.hash) {
    const taskHash = PZHelper.sha256Hex(JSON.stringify(args))
    let task: PZTask.AsyncTask<ExtractProgress>

    if (args.type === 'file') {
      const file = loader.instance.loadIndex().findFile(args.source.folderId, args.source.filename)
      if (!file) {
        return { success: false, message: 'extract file not found' }
      }

      task = loader.instance.extractFileAsync(file, args.target)
    } else if (args.type === 'folder') {
      const folder = loader.instance.loadIndex().getFolder(args.source.folderId)
      if (!folder) {
        return { success: false, message: 'extract folder not found' }
      }

      task = loader.instance.extractFolderAsync(folder, args.target)
    } else {
      task = loader.instance.extractAllAsync(args.target)
    }

    const sender = getSender('pzpk:extract')
    const completer = getSender('pzpk:extractcomplete')
    const errorSender = getSender('pzpk:extracterror')
    task.subscribe(
      (p) => sender.send({ hash: taskHash, progress: p }),
      (err) => {
        errorSender.send({ hash: taskHash, error: err.message })
      },
      () => {
        completer.send({ hash: taskHash, canceled: task.canceled })
      },
    )
    bindTask(taskHash, task)

    return { success: true, hash: taskHash }
  } else {
    return { success: false, message: 'load index failed' }
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
  const errorSender = getSender('pzpk:builderror')
  task.subscribe(
    (p) => sender.send({ hash, progress: p }),
    (err) => {
      errorSender.send({ hash, error: err.message })
    },
    () => {
      completer.send({ hash, canceled: task.canceled })
    },
  )

  bindTask(hash, task)

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
  const errorSender = getSender('pzpk:builderror')
  task.subscribe(
    (p) => sender.send({ hash, progress: p }),
    (err) => {
      errorSender.send({ hash, error: err.message })
    },
    () => {
      completer.send({ hash, canceled: task.canceled })
    },
  )

  bindTask(hash, task)

  return { success: true, hash }
}

export const cancelTask = (hash: string) => {
  if (runningContext.task?.hash === hash) {
    closeTask()
  }
}