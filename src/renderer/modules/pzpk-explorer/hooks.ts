import { createContext, useCallback, useMemo, useReducer } from 'react'
import naturalCompare from 'natural-compare-lite'
import type { PZFilePacked, PZFolder, PZLoader } from 'pzpack'
import { PZInstanceObservable } from '../../service/pzpack'
import { isImageFile } from '../../utils'

export interface ExplorerContextType {
  loader: PZLoader
  openImage: (file: PZFilePacked) => void
}
export const ExplorerContext = createContext<ExplorerContextType>({} as ExplorerContextType)

type imageCache = { time: number; url: string }
const cacheStore = new Map<string, imageCache>()

const clearupCache = (count: number = 10) => {
  if (cacheStore.size > count) {
    const kv: [string, imageCache][] = []
    cacheStore.forEach((v, k) => {
      kv.push([k, v])
    })
    const removes = kv.sort((a, b) => b[1].time - a[1].time).slice(count)
    removes.forEach(([k, v]) => {
      cacheStore.delete(k)
      URL.revokeObjectURL(v.url)
    })
  }
}
const readImage = async (loader: PZLoader, file: PZFilePacked) => {
  const id = `${file.pid}/${file.name}`

  let cache = cacheStore.get(id)
  if (!cache) {
    const data = await loader.loadFileAsync(file)
    const blob = new Blob([data])
    const url = URL.createObjectURL(blob)
    cache = { time: Date.now(), url }
    cacheStore.set(id, cache)
  } else {
    cache.time = Date.now()
  }

  clearupCache()
  return cache.url
}
PZInstanceObservable.subscribe(() => {
  clearupCache(0)
})

export interface ImageViewerContextType {
  next: () => void
  prev: () => void
  goto: (index: number) => void
  count: number
  total: number
  getImage: (index: number) => Promise<string>
  getFile: (index: number) => PZFilePacked
}
export const ImageViewerContext = createContext<ImageViewerContextType>({} as ImageViewerContextType)

type IndexChangePayload = {
  action: 'next' | 'prev' | 'goto'
  length: number
  value: number
}
const idxNext = (length: number): IndexChangePayload => {
  return { action: 'next', value: 0, length }
}
const idxPrev = (length: number): IndexChangePayload => {
  return { action: 'prev', value: 0, length }
}
const idxGoto = (value: number, length: number): IndexChangePayload => {
  return { action: 'goto', value, length }
}
const indexReducer = (prev: number, payload: IndexChangePayload) => {
  let result = 0
  if (payload.action === 'prev') result = prev - 1
  else if (payload.action === 'next') result = prev + 1
  else if (payload.action === 'goto') result = payload.value

  if (result > payload.length - 1) result = payload.length - 1
  if (result < 0) result = 0
  return result
}
export const useImageContext = (loader: PZLoader, folder: PZFolder, initedFile: PZFilePacked) => {
  const { index: initIndex, list } = useMemo(() => {
    const idxLoader = loader.loadIndex()
    const imageList = idxLoader
      .getChildren(folder)
      .files.filter((f) => isImageFile(f))
      .sort((a, b) => naturalCompare(a.name, b.name))
    const findIdx = imageList.indexOf(initedFile)

    return {
      list: imageList,
      index: findIdx,
    }
  }, [loader, folder.id, initedFile])
  const [index, dispatchIndex] = useReducer(indexReducer, initIndex)

  const next = useCallback(() => dispatchIndex(idxNext(list.length)), [list])
  const prev = useCallback(() => dispatchIndex(idxPrev(list.length)), [list])
  const goto = useCallback((target: number) => dispatchIndex(idxGoto(target, list.length)), [list])
  const total = useMemo(() => list.length, [list])
  const getImage = useCallback(
    (target: number) => {
      const file = list[target]
      return readImage(loader, file)
    },
    [loader, list],
  )
  const getFile = useCallback(
    (target: number) => {
      return list[target]
    },
    [loader, list],
  )

  return {
    count: index,
    next,
    prev,
    goto,
    total,
    getImage,
    getFile,
  }
}
