import { OpenPzFile, PZSubscription, type PZLoader, type PZBuilder, PZFilePacked } from 'pzpack'
import { RendererLogger } from './logger'

type OpenFileResult = {
  success: boolean
  message?: string
}
type PZPackBindings = {
  loader?: PZLoader
  builder?: PZBuilder
}

const PZLoaderNotify = new PZSubscription.PZNotify<PZLoader | undefined>()
export const PZLoaderObservable = PZLoaderNotify.asObservable()
const _bindings: PZPackBindings = {}
export const binding: Readonly<PZPackBindings> = {
  get loader() {
    return _bindings.loader
  },
  get builder() {
    return _bindings.builder
  },
}

export const openPZPackFile = (file: string, password: string): OpenFileResult => {
  const { loader } = _bindings

  try {
    if (loader) {
      if (file === loader.filename) return { success: false, message: 'already opened file' }
      loader.close()
      _bindings.loader = undefined
    }

    _bindings.loader = OpenPzFile(file, password)
    PZLoaderNotify.next(_bindings.loader)
    return { success: true }
  } catch (err) {
    _bindings.loader = undefined
    RendererLogger.errorStack(err)
    PZLoaderNotify.next(undefined)

    return { success: false, message: (err as Error).message }
  }
}
export const closePZLoader = () => {
  if (_bindings.loader) {
    _bindings.loader.close()
    _bindings.loader = undefined
    PZLoaderNotify.next(undefined)
  }
}

const imageStore = new Map<string, string>()
const imageStoreSize = 10
const imageIdQueue: string[] = []
const clearupImages = (lastest: string) => {
  const hasIdx = imageIdQueue.indexOf(lastest)
  if (hasIdx >= 0) {
    imageIdQueue.splice(hasIdx, 1)
  }

  imageIdQueue.push(lastest)
  if (imageIdQueue.length > imageStoreSize) {
    const revokeId = imageIdQueue.shift()!
    const url = imageStore.get(revokeId)
    url && URL.revokeObjectURL(url)
    imageStore.delete(revokeId)
  }
}
export const loadImage = (file: PZFilePacked) => {
  if (!_bindings.loader) {
    throw new Error('loader not avaliable')
  }

  const loader = _bindings.loader
  const id = `${loader.filename}@${file.pid}/${file.name}`
  if (!imageStore.has(id)) {
    const data = loader.loadFile(file)
    const blob = new Blob([data])
    const url = URL.createObjectURL(blob)
    imageStore.set(id, url)

    clearupImages(id)
  }

  return imageStore.get(id)!
}
