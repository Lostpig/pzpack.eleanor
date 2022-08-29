import {
  PZIndexBuilder,
  PZSubscription,
  serializePZIndexBuilder,
  type BuildProgress,
  type ExtractProgress,
  type PZFilePacked,
  type PZFolder,
  PZTask,
  PZExceptions,
} from 'pzpack'
import type { PZBuildArgs, PZLoaderStatus, PZExtractArgs, PZPKTaskSuccess, PZPKBaseResult, PZPKSuccessResult } from '../../lib/declares'
import { errorCodes, createErrorResult } from '../../lib/exceptions'
import { invokeIpc, subscribeChannel } from './ipc'

interface PZInstanceBase {
  type: 'builder' | 'explorer'
}
interface PZBuilderInstance extends PZInstanceBase {
  type: 'builder'
  binding: PZIndexBuilder
}
interface PZExplorerInstance extends PZInstanceBase {
  type: 'explorer'
  hash: string
  port: number
  status: PZLoaderStatus
}
export type PZInstance = PZBuilderInstance | PZExplorerInstance

const PZInstanceSubject = new PZSubscription.PZBehaviorSubject<PZInstance | undefined>(undefined)
export const PZInstanceObservable = PZInstanceSubject.toObservable()

export const bindingExplorer = async (hash: string, port: number, status: PZLoaderStatus) => {
  const explorerInst: PZExplorerInstance = {
    type: 'explorer',
    hash,
    port,
    status,
  }
  PZInstanceSubject.next(explorerInst)
  return { success: true } as PZPKSuccessResult
}
export const openPZloader = async (
  filename: string,
  password: string,
): Promise<PZPKBaseResult> => {
  const result = await invokeIpc('pzpk:open', { path: filename, password })
  if (!result.success) return result
  return await bindingExplorer(result.hash, result.port, result.loaderStatus)
}
export const closePZInstance = async () => {
  const current = PZInstanceSubject.current
  if (current) {
    if (current.type === 'explorer') {
      await invokeIpc('pzpk:close', current.hash)
    }
    PZInstanceSubject.next(undefined)
  }
}

const createIPCTask = (res: PZPKTaskSuccess): PZTask.AsyncTask<unknown> => {
  const [task, cancelToken] = PZTask.taskManager.create<unknown>(res.initState)
  const subscription = subscribeChannel('pzpk:task', (data) => {
    if (data.id !== res.taskId) return

    if (data.status === 'next') {
      PZTask.taskManager.update(task, data.data as Partial<unknown>)
    } else if (data.status === 'error') {
      PZTask.taskManager.throwError(
        task,
        new PZExceptions.PZError(data.error.errorCode ?? errorCodes.Other, data.error.param, data.error.message),
      )
      subscription.unsubscribe()
    } else {
      PZTask.taskManager.complete(task)
      subscription.unsubscribe()
    }
  })
  cancelToken.onChange(() => {
    invokeIpc('pzpk:canceltask', res.taskId)
  })

  return task
}
export const openPZBuilder = () => {
  const instance = PZInstanceSubject.current
  if (instance && instance.type === 'builder') return
  if (instance) closePZInstance()

  const indexBuilder = new PZIndexBuilder()
  PZInstanceSubject.next({ type: 'builder', binding: indexBuilder })
}
export const startPZBuild = async (
  indexBuilder: PZIndexBuilder,
  target: string,
  blockSize: number,
  password: string,
) => {
  const args: PZBuildArgs = {
    options: { target, password, blockSize },
    indexData: serializePZIndexBuilder(indexBuilder),
  }

  const result = await invokeIpc('pzpk:build', args)
  if (result.success) {
    return {
      success: true,
      task: createIPCTask(result),
    } as { success: true; task: PZTask.AsyncTask<BuildProgress> }
  } else {
    return result
  }
}

const startExtract = async (args: PZExtractArgs) => {
  const result = await invokeIpc('pzpk:extract', args)
  if (result.success) {
    return {
      success: true,
      task: createIPCTask(result),
    } as { success: true; task: PZTask.AsyncTask<ExtractProgress> }
  } else {
    return result
  }
}
export const extractFile = async (file: PZFilePacked, target: string) => {
  if (!PZInstanceSubject.current || PZInstanceSubject.current.type !== 'explorer') {
    return createErrorResult(errorCodes.PZFileNotOpened)
  }
  const args: PZExtractArgs = {
    type: 'file',
    hash: PZInstanceSubject.current.hash,
    source: file.fullname,
    target,
  }

  return await startExtract(args)
}
export const extractFolder = async (folder: PZFolder, target: string) => {
  if (!PZInstanceSubject.current || PZInstanceSubject.current.type !== 'explorer') {
    return createErrorResult(errorCodes.PZFileNotOpened)
  }
  const args: PZExtractArgs = {
    type: 'folder',
    hash: PZInstanceSubject.current.hash,
    source: folder.fullname,
    target,
  }

  return await startExtract(args)
}
export const extractAll = async (target: string) => {
  if (!PZInstanceSubject.current || PZInstanceSubject.current.type !== 'explorer') {
    return createErrorResult(errorCodes.PZFileNotOpened)
  }
  const args: PZExtractArgs = {
    type: 'all',
    hash: PZInstanceSubject.current.hash,
    source: '/',
    target,
  }

  return await startExtract(args)
}

export const loadIndex = async (path: string) => {
  if (!PZInstanceSubject.current || PZInstanceSubject.current.type !== 'explorer') {
    return createErrorResult(errorCodes.PZFileNotOpened)
  }

  return invokeIpc('pzpk:getIndex', { hash: PZInstanceSubject.current.hash, path })
}
