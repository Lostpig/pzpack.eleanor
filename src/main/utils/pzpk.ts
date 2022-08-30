import * as fsp from 'fs/promises'
import {
  type PZLoader,
  type PZTask,
  type ExtractProgress,
  PZSubscription,
  deserializePZIndexBuilder,
  PZHash,
  createPZLoader,
  PZUtils,
  buildPZPackFile,
  PZExceptions,
} from 'pzpack'
import type {
  PZPKOpenResult,
  PZPKTaskResult,
  PZExtractArgs,
  PZIndexArgs,
  PZPKIndexResult,
  PZBuildArgs,
  PZOpenArgs,
  PZPKTaskSuccess,
} from '../../lib/declares'
import { createErrorResult, errorCodes, errorHandler } from '../../lib/exceptions'
import type { PasswordBook } from './pwbook'
import { getSender } from './ipc'
import { appLogger } from './logger'
import { instance as pzServer } from './pzpk.server'

const serverPort = 42506
type PZLoaderContext = {
  readonly hash: string
  readonly path: string
  readonly instance: PZLoader
}
interface PZContext {
  loader?: PZLoaderContext
}
const runningContext: PZContext = {}
const closeLoader = () => {
  if (runningContext.loader) {
    runningContext.loader.instance.close()
    runningContext.loader = undefined
    pzServer.unbind()
  }
}
const bindLoader = async (loader: PZLoaderContext) => {
  closeLoader()

  pzServer.binding(loader.hash, loader.instance)
  await pzServer.start(serverPort)

  runningContext.loader = loader
}

const getPZFilePwHash = async (source: fsp.FileHandle) => {
  const buffer = Buffer.alloc(32)
  await source.read(buffer, 0, 32, 36)
  return PZUtils.bytesToHex(buffer)
}
const createPZLoaderContext = async (
  source: fsp.FileHandle,
  file: string,
  password: string | Buffer,
): Promise<PZLoaderContext> => {
  const hash = PZHash.sha256Hex(file)
  const loader = await createPZLoader(source, password)
  return {
    hash,
    instance: loader,
    path: file,
  }
}

export const openPZloader = async (args: PZOpenArgs): Promise<PZPKOpenResult> => {
  try {
    if (args.path === runningContext.loader?.path) {
      return createErrorResult(errorCodes.PZPKFileAlreadyOpened)
    }
    const source = await fsp.open(args.path, 'r+')
    const loader = await createPZLoaderContext(source, args.path, args.password)

    bindLoader(loader)
    return {
      success: true,
      hash: loader.hash,
      port: serverPort,
      loaderStatus: {
        filename: args.path,
        version: loader.instance.version,
        size: loader.instance.size,
      },
    }
  } catch (err) {
    closeLoader()
    return errorHandler(err, appLogger)
  }
}
export const tryOpenPZloader = async (file: string, book: PasswordBook): Promise<PZPKOpenResult> => {
  try {
    if (file === runningContext.loader?.path) {
      return createErrorResult(errorCodes.PZPKFileAlreadyOpened)
    }
    const source = await fsp.open(file, 'r+')
    const pwHash = await getPZFilePwHash(source)

    const record = book.get(pwHash)
    if (record) {
      const loader = await createPZLoaderContext(source, file, record.key)
      bindLoader(loader)
      return {
        success: true,
        hash: loader.hash,
        port: serverPort,
        loaderStatus: {
          filename: file,
          version: loader.instance.version,
          size: loader.instance.size,
        },
      }
    } else {
      return createErrorResult(errorCodes.Other)
    }
  } catch (err) {
    closeLoader()
    return errorHandler(err, appLogger)
  }
}
export const closePZloader = (hash: string) => {
  if (hash === runningContext.loader?.hash) {
    closeLoader()
  }
}

let taskIdCounter = 1
const taskStore = new Map<string, PZTask.AsyncTask<unknown>>()
const createIPCTask = (task: PZTask.AsyncTask<unknown>, frequency: number = 200): PZPKTaskSuccess => {
  const obs = PZSubscription.frequencyPipe(task.observable(), frequency)
  const id = `${Date.now()}-${taskIdCounter++}`

  const sender = getSender('pzpk:task')
  obs.subscribe(
    (p) => {
      sender.send({
        id,
        status: 'next',
        data: p,
      })
    },
    (err) => {
      const errResult = errorHandler(err, appLogger)
      sender.send({
        id,
        status: 'error',
        error: errResult.error
      })
      taskStore.delete(id)
    },
    (r) => {
      sender.send({
        id,
        canceled: task.canceled,
        status: 'complete',
        data: r,
      })
      taskStore.delete(id)
    },
  )
  taskStore.set(id, task)

  return { success: true, taskId: id, initState: obs.current }
}
export const startExtract = (args: PZExtractArgs): PZPKTaskResult => {
  if (runningContext.loader?.hash === args.hash) {
    const { instance } = runningContext.loader
    const { index } = instance
    let task: PZTask.AsyncTask<ExtractProgress>

    if (args.type === 'file') {
      const file = index.getFile(args.source)
      if (!file) {
        return createErrorResult(PZExceptions.errorCodes.FileNotFound, { path: args.source })
      }
      task = instance.extractFile(file, args.target)
    } else if (args.type === 'folder') {
      const folder = index.getFolder(args.source)
      if (!folder) {
        return createErrorResult(PZExceptions.errorCodes.FolderNotFound, { path: args.source })
      }
      task = instance.extractBatch(folder, args.target)
    } else {
      task = instance.extractBatch(index.root, args.target)
    }

    return createIPCTask(task)
  } else {
    return createErrorResult(errorCodes.PZPKHashCheckInvalid)
  }
}
export const startBuild = (args: PZBuildArgs): PZPKTaskResult => {
  const indexBuilder = deserializePZIndexBuilder(args.indexData)
  const task = buildPZPackFile(indexBuilder, args.options)
  return  createIPCTask(task)
}
export const cancelTask = (id: string) => {
  taskStore.get(id)?.cancel()
}

export const getIndex = (args: PZIndexArgs): PZPKIndexResult => {
  if (runningContext.loader?.hash !== args.hash) {
    return createErrorResult(errorCodes.PZPKHashCheckInvalid)
  }

  const { index } = runningContext.loader.instance
  const folder = index.folderOfId(args.folderId ?? index.root.id)
  if (!folder) {
    return createErrorResult(PZExceptions.errorCodes.FolderNotFound, { id: args.folderId ?? "" })
  }

  const path = index.getFoldersToRoot(folder)
  const children = index.getChildren(folder)
  return {
    success: true,
    data: {
      path,
      files: children.files,
      folders: children.folders,
    },
  }
}
