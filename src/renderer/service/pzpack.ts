import { OpenPzFile, PZSubscription, PZVideo, type PZLoader, PZIndexBuilder, PZBuilder } from 'pzpack'
import { RendererLogger } from './logger'

type OpenPZLoaderResult = {
  success: boolean
  message?: string
}
interface PZInstanceBase {
  type: 'builder' | 'mvbuilder' | 'loader' | 'mvloader'
  binding: PZIndexBuilder | PZLoader | PZVideo.PZMVBuilder | PZVideo.PZMVSimpleServer
}
interface PZBuilderInstance extends PZInstanceBase {
  type: 'builder'
  binding: PZIndexBuilder
}
interface PZMVBuilderInstance extends PZInstanceBase {
  type: 'mvbuilder'
  binding: PZVideo.PZMVBuilder
}
interface PZLoaderInstance extends PZInstanceBase {
  type: 'loader'
  binding: PZLoader
}
interface PZMVLoaderInstance extends PZInstanceBase {
  type: 'mvloader'
  binding: PZVideo.PZMVSimpleServer
}
export type PZInstance = PZBuilderInstance | PZMVBuilderInstance | PZLoaderInstance | PZMVLoaderInstance

const PZInstanceNotify = new PZSubscription.PZBehaviorNotify<PZInstance | undefined>(undefined)
export const PZInstanceObservable = PZInstanceNotify.asObservable()

const closeInstance = (instance: PZInstance) => {
  if (instance.type === 'loader') {
    instance.binding.close()
  } else if (instance.type === 'mvloader') {
    instance.binding.close()
    instance.binding.loader.close()
  }
}
const pushPZLoader = (loader: PZLoader) => {
  if (loader.type === 'PZPACK') {
    PZInstanceNotify.next({ type: 'loader', binding: loader })
  } else {
    const server = new PZVideo.PZMVSimpleServer(loader)
    PZInstanceNotify.next({ type: 'mvloader', binding: server })
  }
}
export const openPZloader = (file: string, password: string): OpenPZLoaderResult => {
  const instance = PZInstanceNotify.current
  let loader: PZLoader | undefined

  try {
    if (instance && instance.type === 'loader') {
      if (file === instance.binding.filename) return { success: false, message: 'already opened file' }
    }

    loader = OpenPzFile(file, password)
    if (instance) closeInstance(instance)
    pushPZLoader(loader)
    return { success: true }
  } catch (err) {
    RendererLogger.errorStack(err)
    if (loader) {
      loader.close()
    }

    return { success: false, message: (err as Error).message }
  }
}
export const closePZInstance = () => {
  const current = PZInstanceNotify.current

  if (current) {
    closeInstance(current)
    PZInstanceNotify.next(undefined)
  }
}

export const openPZBuilder = () => {
  const instance = PZInstanceNotify.current
  if (instance && instance.type === 'builder') return
  if (instance) closeInstance(instance)

  const indexBuilder = new PZIndexBuilder()
  PZInstanceNotify.next({ type: 'builder', binding: indexBuilder })
}
export const startPZBuild = (indexBuilder: PZIndexBuilder, target: string, description: string, password: string) => {
  const builder = new PZBuilder({
    type: 'PZPACK',
    indexBuilder,
    password
  })
  builder.setDescription(description)
  const task = builder.buildTo(target)
  return task
}
