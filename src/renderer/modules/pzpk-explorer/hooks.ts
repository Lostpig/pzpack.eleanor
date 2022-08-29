import { createContext, useCallback, useMemo, useReducer } from 'react'
import naturalCompare from 'natural-compare-lite'
import type { PZFilePacked } from 'pzpack'
import { isImageFile, createFileUrl } from '../../utils'
import type { PZLoaderStatus } from '../../../lib/declares'

export interface ExplorerContextType {
  port: number
  status: PZLoaderStatus
  hash: string
}
export const ExplorerContext = createContext<ExplorerContextType>({} as ExplorerContextType)

export interface ImageViewerContextType {
  next: () => void
  prev: () => void
  goto: (index: number) => void
  count: number
  total: number
  getImage: (index: number) => string
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
export const useImageContext = (port: number, hash: string, files: PZFilePacked[], initFile: PZFilePacked) => {
  const { index: initIndex, list } = useMemo(() => {
    const imageList = files.filter((f) => isImageFile(f))
      .sort((a, b) => naturalCompare(a.name, b.name))
    const findIdx = imageList.indexOf(initFile)

    return {
      list: imageList,
      index: findIdx,
    }
  }, [files, initFile])
  const [index, dispatchIndex] = useReducer(indexReducer, initIndex)

  const next = useCallback(() => dispatchIndex(idxNext(list.length)), [list])
  const prev = useCallback(() => dispatchIndex(idxPrev(list.length)), [list])
  const goto = useCallback((target: number) => dispatchIndex(idxGoto(target, list.length)), [list])
  const total = useMemo(() => list.length, [list])
  const getImage = useCallback(
    (target: number) => {
      const file = list[target]
      return createFileUrl(port, hash, file)
    },
    [port, list],
  )
  const getFile = useCallback(
    (target: number) => {
      return list[target]
    },
    [list],
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
