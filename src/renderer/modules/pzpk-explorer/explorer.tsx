import React, { memo, useState, useContext, createContext, useEffect, useMemo, useCallback } from 'react'
import type { PZLoader, PZFolder, PZFilePacked } from 'pzpack'
import naturalCompare from 'natural-compare-lite'
import { FiletypeIcon, RightIcon, InfoIcon } from '../icons'
import { PZButton } from '../shared'
import { formatSize, isImageFile } from '../../utils'
import { ExplorerContext } from './hooks'
import { useModalManager, useInfoDialog } from '../common'
import { ImageViewer } from './image-viewer'
import { useTranslation } from 'react-i18next'

type ContentContextType = {
  navigate: (folder: PZFolder) => void
}
const ContentContext = createContext<ContentContextType>({ navigate: () => {} })

const ExplorerInfoSeparator = () => {
  return <div className="mx-3 w-px h-4/5 bg-neutral-400"></div>
}
const Breadcrumbs: React.FC<{ current: PZFolder }> = memo((props) => {
  const { loader } = useContext(ExplorerContext)
  const [t] = useTranslation()
  const { navigate } = useContext(ContentContext)
  const { current } = props
  const idx = loader.loadIndex()
  const list = idx.getFoldersToRoot(current)
  const info = useInfoDialog()
  const showDesc = useCallback(() => {
    const desc = loader.getDescription()
    info(desc, t('file description'))
  }, [loader, info, t])

  return (
    <div className="py-1 px-3 flex items-center justify-start shadow-sm dark:shadow-black">
      <PZButton type="icon" onClick={showDesc}>
        <InfoIcon size={20} />
      </PZButton>
      <ExplorerInfoSeparator />
      {list.map((f) => {
        const name = f.id === idx.root.id ? 'root' : f.name
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
  const { loader } = useContext(ExplorerContext)
  const idx = loader.loadIndex()
  const children = idx.getChildren(props.current)

  return (
    <div className="flex-1 overflow-auto">
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
  const { loader } = useContext(ExplorerContext)
  const idx = loader.loadIndex()
  const children = idx.getChildren(props.current)

  return (
    <div className="flex flex-row border-t px-4 py-1 border-neutral-400 dark:border-neutral-700 dark:text-gray-50">
      <div className="flex-1 flex items-center">
        <span>{t('##_folders', { count: children.folders.length })}</span>
        <ExplorerInfoSeparator />
        <span>{t('##_files', { count: children.files.length })}</span>
        <ExplorerInfoSeparator />
        <span>{formatSize(loader.size)}</span>
        <ExplorerInfoSeparator />
        <span>{t('pack version ##', { version: loader.version })}</span>
        <ExplorerInfoSeparator />
        <span>{t('pack type ##', { type: loader.type })}</span>
        <ExplorerInfoSeparator />
        <span>{loader.filename}</span>
      </div>
    </div>
  )
})

const ExplorerContent = () => {
  const { loader } = useContext(ExplorerContext)
  const idx = loader.loadIndex()
  const [currentFolder, setCurrentFolder] = useState(idx.root)

  const context: ContentContextType = useMemo(
    () => ({ navigate: (folder) => setCurrentFolder(folder) }),
    [setCurrentFolder],
  )
  useEffect(() => {
    setCurrentFolder(idx.root)
  }, [loader])

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

export const PZFileExplorer: React.FC<{ loader: PZLoader }> = memo(({ loader }) => {
  const { openModal } = useModalManager()
  const openImage = (file: PZFilePacked) => {
    if (!isImageFile(file)) return

    const idx = loader.loadIndex()
    const folder = idx.getFolder(file.pid)
    if (!folder) return

    openModal(<ImageViewer loader={loader} folder={folder} initFile={file} />)
  }

  return (
    <ExplorerContext.Provider value={{ loader, openImage }}>
      <ExplorerContent />
    </ExplorerContext.Provider>
  )
})
