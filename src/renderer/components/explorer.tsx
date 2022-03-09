import React, { memo, useState, useContext, createContext, useEffect } from 'react'
import { type PZLoader, type PZFolder, PZFilePacked } from 'pzpack'
import { openViewerFile } from './viewer'
import { FiletypeIcon } from '../icons/filetype'
import { PZButton } from './common'
import { formatSize } from '../utils'

type ContainerContext = {
  loader: PZLoader
}
type ContentContext = {
  navigate: (folder: PZFolder) => void
}
const ContainerToken = createContext<ContainerContext>({} as ContainerContext)
const ContentToken = createContext<ContentContext>({ navigate: () => {} })

const Breadcrumbs: React.FC<{ current: PZFolder }> = memo((props) => {
  const { loader } = useContext(ContainerToken)
  const { navigate } = useContext(ContentToken)
  const { current } = props
  const idx = loader.loadIndex()
  const list = idx.getFoldersToRoot(current)

  return (
    <div className="py-1 px-5 flex justify-start shadow-sm dark:shadow-black">
      {list.map((f, i) => {
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
  const { navigate } = useContext(ContentToken)

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
  return (
    <div
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
      onDoubleClick={() => openViewerFile(file)}
    >
      <FiletypeIcon type={file.ext} size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{file.name}</div>
      <div className="text-right w-32 pr-4">{formatSize(file.size)}</div>
    </div>
  )
})
const ExplorerList: React.FC<{ current: PZFolder }> = memo((props) => {
  const { loader } = useContext(ContainerToken)
  const idx = loader.loadIndex()
  const children = idx.getChildren(props.current)

  return (
    <div className="flex-1 overflow-auto">
      {children.folders.map((f) => (
        <ExolorerFolder key={f.id} folder={f} />
      ))}
      {children.files.map((f) => (
        <ExolorerFile key={f.fullname} file={f} />
      ))}
    </div>
  )
})
const ExplorerInfo: React.FC<{ current: PZFolder }> = memo((props) => {
  const { loader } = useContext(ContainerToken)
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
  const { loader } = useContext(ContainerToken)
  const idx = loader.loadIndex()
  const [currentFolder, setCurrentFolder] = useState(idx.root)

  const context: ContentContext = { navigate: (folder) => setCurrentFolder(folder) }
  useEffect(() => {
    setCurrentFolder(idx.root)
  }, [loader])

  return (
    <div className="w-full h-full flex flex-col">
      <ContentToken.Provider value={context}>
        <Breadcrumbs current={currentFolder} />
        <ExplorerList current={currentFolder} />
        <ExplorerInfo current={currentFolder} />
      </ContentToken.Provider>
    </div>
  )
}

export const PZFileExplorer = memo((props: { loader: PZLoader }) => {
  return (
    <ContainerToken.Provider value={{ loader: props.loader }}>
      <ExplorerContent />
    </ContainerToken.Provider>
  )
})
