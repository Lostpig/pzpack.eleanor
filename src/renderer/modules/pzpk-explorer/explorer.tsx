import React, { memo, useState, useContext, createContext, useMemo, useCallback } from 'react'
import type { PZIndexReader, PZFolder, PZFilePacked } from 'pzpack'
import naturalCompare from 'natural-compare-lite'
import { useTranslation } from 'react-i18next'

import { FiletypeIcon, RightIcon, InfoIcon } from '../icons'
import { PZButton } from '../shared'
import { formatSize, isImageFile } from '../../utils'
import { ExplorerContext } from './hooks'
import { useInfoDialog } from '../common'
import { ImageViewer } from './image-viewer'
import type { PZLoaderStatus } from '../../../lib/declares'
import { openModal } from '../../service/modal'

type ContentContextType = {
  navigate: (folder: PZFolder) => void
}
const ContentContext = createContext<ContentContextType>({ navigate: () => {} })

const ExplorerInfoSeparator = () => {
  return <div className="mx-3 w-px h-4/5 bg-neutral-400"></div>
}
const Breadcrumbs: React.FC<{ current: PZFolder }> = memo((props) => {
  const { indices, status } = useContext(ExplorerContext)
  const [t] = useTranslation()
  const { navigate } = useContext(ContentContext)
  const { current } = props
  const list = indices.getFoldersToRoot(current)
  const info = useInfoDialog()
  const showDesc = useCallback(() => {
    info(status.description, t('file description'))
  }, [status, info, t])

  return (
    <div className="py-1 px-3 flex items-center justify-start shadow-sm dark:shadow-black">
      <PZButton type="icon" onClick={showDesc}>
        <InfoIcon size={20} />
      </PZButton>
      <ExplorerInfoSeparator />
      {list.map((f) => {
        const name = f.id === indices.root.id ? 'root' : f.name
        return (
          <div key={f.id}>
            <PZButton className="flex items-center" type="link" onClick={() => navigate(f)} disabled={f === current}>
              <span className="mr-4">{name}</span>
              {f === current ? null : <RightIcon size={16} />}
            </PZButton>
          </div>
        )
      })}
    </div>
  )
})
const ExolorerFolder: React.FC<{ folder: PZFolder }> = memo((props) => {
  const { folder } = props
  const { navigate } = useContext(ContentContext)

  return (
    <div
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
      onDoubleClick={() => navigate(folder)}
    >
      <FiletypeIcon type="folder" size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{folder.name}</div>
      <div className="text-right w-30 pr-4"></div>
    </div>
  )
})
const ExolorerFile: React.FC<{ file: PZFilePacked }> = memo((props) => {
  const { file } = props
  const { openImage } = useContext(ExplorerContext)

  return (
    <div
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
      onDoubleClick={() => openImage(file)}
    >
      <FiletypeIcon type={file.ext} size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{file.name}</div>
      <div className="text-right w-32 pr-4">{formatSize(file.size)}</div>
    </div>
  )
})
const ExplorerList: React.FC<{ current: PZFolder }> = memo((props) => {
  const { indices } = useContext(ExplorerContext)
  const children = indices.getChildren(props.current)

  return (
    <div className="flex-1 auto-scrollbar">
      {children.folders
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((f) => (
          <ExolorerFolder key={f.id} folder={f} />
        ))}
      {children.files
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((f) => (
          <ExolorerFile key={f.fullname} file={f} />
        ))}
    </div>
  )
})
const ExplorerInfo: React.FC<{ current: PZFolder }> = memo((props) => {
  const [t] = useTranslation()
  const { indices, status } = useContext(ExplorerContext)
  const children = indices.getChildren(props.current)

  return (
    <div className="flex flex-row border-t px-4 py-1 border-neutral-400 dark:border-neutral-700 dark:text-gray-50">
      <div className="flex-1 flex items-center">
        <span>{t('##_folders', { count: children.folders.length })}</span>
        <ExplorerInfoSeparator />
        <span>{t('##_files', { count: children.files.length })}</span>
        <ExplorerInfoSeparator />
        <span>{formatSize(status.size)}</span>
        <ExplorerInfoSeparator />
        <span>{t('pack version ##', { version: status.version })}</span>
        <ExplorerInfoSeparator />
        <span>{t('pack type ##', { type: status.type })}</span>
        <ExplorerInfoSeparator />
        <span>{status.filename}</span>
      </div>
    </div>
  )
})

const ExplorerContent = () => {
  const { indices } = useContext(ExplorerContext)
  const [currentFolder, setCurrentFolder] = useState(indices.root)
  const [idxCache, setIdxCache] = useState(indices)

  const context: ContentContextType = useMemo(
    () => ({ navigate: (folder) => setCurrentFolder(folder) }),
    [setCurrentFolder],
  )
  if (indices !== idxCache) {
    setIdxCache(indices)
    setCurrentFolder(indices.root)
  }

  return (
    <div className="w-full h-full flex flex-col">
      <ContentContext.Provider value={context}>
        <Breadcrumbs current={currentFolder} />
        <ExplorerList current={currentFolder} />
        <ExplorerInfo current={currentFolder} />
      </ContentContext.Provider>
    </div>
  )
}

type PZFileExplorerProps = {
  indices: PZIndexReader
  hash: string
  port: number
  status: PZLoaderStatus
}
export const PZFileExplorer: React.FC<PZFileExplorerProps> = memo((props) => {
  const { indices, port, status, hash } = props

  const openImage = (file: PZFilePacked) => {
    if (!isImageFile(file)) return

    const folder = indices.getFolder(file.pid)
    if (!folder) return

    openModal(<ImageViewer hash={hash} port={port} indices={indices} folder={folder} initFile={file} />)
  }

  return (
    <ExplorerContext.Provider value={{ indices, port, status, openImage }}>
      <ExplorerContent />
    </ExplorerContext.Provider>
  )
})
