import React, { memo, useState, useContext, createContext, useEffect, useMemo } from 'react'
import type { PZLoader, PZFolder, PZFilePacked } from 'pzpack'
import naturalCompare from 'natural-compare-lite'
import { FiletypeIcon } from '../icons'
import { PZButton } from '../shared'
import { formatSize, isImageFile } from '../../utils'
import { ExplorerContext } from './hooks'
import { useModalManager } from '../common'
import { ImageViewer } from './image-viewer'

type ContentContextType = {
  navigate: (folder: PZFolder) => void
}
const ContentContext = createContext<ContentContextType>({ navigate: () => {} })

const Breadcrumbs: React.FC<{ current: PZFolder }> = memo((props) => {
  const { loader } = useContext(ExplorerContext)
  const { navigate } = useContext(ContentContext)
  const { current } = props
  const idx = loader.loadIndex()
  const list = idx.getFoldersToRoot(current)

  return (
    <div className="py-1 px-5 flex justify-start shadow-sm dark:shadow-black">
      {list.map((f) => {
        const name = f.id === idx.root.id ? 'root' : f.name
        return (
          <div key={f.id}>
            <PZButton className="mr-1" type="link" onClick={() => navigate(f)} disabled={f === current}>
              {name} {f === current ? '' : '>'}
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
  const { loader } = useContext(ExplorerContext)
  const idx = loader.loadIndex()
  const children = idx.getChildren(props.current)

  return (
    <div className="flex flex-row border-t border-neutral-400 dark:border-neutral-700 dark:text-gray-50">
      <div className="flex-1">
        <span>{children.folders.length} folders</span>|<span>{children.files.length} files</span>
      </div>
      <div className="text-right">
        <span>{loader.filename}</span>|<span>{formatSize(loader.size)}</span>
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
