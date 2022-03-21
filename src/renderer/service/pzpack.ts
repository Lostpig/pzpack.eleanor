import { OpenPzFile, PZSubscription, type PZVideo, type PZLoader, type PZBuilder } from 'pzpack'
import { RendererLogger } from './logger'

type OpenPZLoaderResult = {
  success: boolean
  message?: string
}
interface PZInstanceBase {
  type: 'builder' | 'mvbuilder' | 'loader' | 'mvloader'
  binding: PZBuilder | PZLoader | PZVideo.PZMVBuilder
}
interface PZBuilderInstance extends PZInstanceBase {
  type: 'builder'
  binding: PZBuilder
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
  binding: PZLoader
}
export type PZInstance = PZBuilderInstance | PZMVBuilderInstance | PZLoaderInstance | PZMVLoaderInstance

const PZInstanceNotify = new PZSubscription.PZBehaviorNotify<PZInstance | undefined>(undefined)
export const PZInstanceObservable = PZInstanceNotify.asObservable()

const closeInstance = (instance: PZInstance) => {
  if (instance.type === 'loader' || instance.type === 'mvloader') {
    instance.binding.close()
  }
}
const pushPZLoader = (loader: PZLoader) => {
  const type = loader.type === 'PZPACK' ? 'loader' : 'mvloader'
  PZInstanceNotify.next({ type, binding: loader })
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
