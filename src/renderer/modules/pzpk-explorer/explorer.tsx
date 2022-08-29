import React, { memo, useState, useContext, createContext, useCallback, useEffect } from 'react'
import type { PZFolder, PZFilePacked } from 'pzpack'
import naturalCompare from 'natural-compare-lite'
import { useTranslation } from 'react-i18next'

import { FiletypeIcon, RightIcon, ExtractIcon } from '../icons'
import { PZButton } from '../shared'
import { formatSize, isImageFile, isVideoFile, errorMessage } from '../../utils'
import { ExplorerContext } from './hooks'
import { info } from '../common'
import { ImageViewer } from './image-viewer'
import { VideoPlayer } from './video-player'
import type { PZLoaderStatus } from '../../../lib/declares'
import { openModal } from '../../service/modal'
import { openDir, saveFile } from '../../service/io'
import { extractAll, extractFile, extractFolder, loadIndex } from '../../service/pzpack'
import { openExtractDialog } from './extract'

type ContentContextType = {
  navigate: (folderPath: string) => void
  openFile: (initFile: PZFilePacked) => void
}
const ContentContext = createContext<ContentContextType>({} as ContentContextType)

const ExplorerInfoSeparator = () => {
  return <div className="mx-3 w-px h-4/5 bg-neutral-400"></div>
}
const Breadcrumbs: React.FC<{ current: string }> = memo((props) => {
  const [t] = useTranslation()
  const { navigate } = useContext(ContentContext)
  const { current } = props

  const pathes = current.split('/').filter((s) => s !== '')
  const list: { name: string; fullname: string }[] = [{ name: 'root', fullname: '' }]
  pathes.reduce((p, c) => {
    list.push({
      name: c,
      fullname: p + '/' + c,
    })
    return p + '/' + c
  }, '')

  const extractAllHandler = async () => {
    const targetDir = await openDir()
    if (targetDir) {
      const result = await extractAll(targetDir)
      if (result.success) {
        openExtractDialog(result.task)
      } else {
        info(errorMessage(result.error, t), t('error'), 'error')
      }
    }
  }

  return (
    <div className="py-1 px-3 flex items-center justify-start shadow-sm dark:shadow-black">
      <PZButton type="icon" onClick={extractAllHandler} title={t('extract all')}>
        <ExtractIcon size={20} />
      </PZButton>
      <ExplorerInfoSeparator />
      {list.map((f) => {
        return (
          <div key={f.name}>
            <PZButton
              className="flex items-center"
              type="link"
              onClick={() => navigate(f.fullname)}
              disabled={f.fullname === current}
            >
              <span className="mr-4">{f.name}</span>
              {f.fullname === current ? null : <RightIcon size={16} />}
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
  const [t] = useTranslation()
  const extractHandler = useCallback(async () => {
    const targetDir = await openDir()
    if (targetDir) {
      const result = await extractFolder(folder, targetDir)
      if (result.success) {
        openExtractDialog(result.task)
      } else {
        info(errorMessage(result.error, t), t('error'), 'error')
      }
    }
  }, [folder])

  return (
    <div
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
      onDoubleClick={() => navigate(folder.fullname)}
    >
      <FiletypeIcon type="folder" size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{folder.name}</div>
      <div className="text-right w-30 pr-4"></div>
      <div className="text-right w-32 pr-4 text-sm">
        <PZButton type="link" onClick={extractHandler} title={t('extract folder')}>
          {t('extract')}
        </PZButton>
      </div>
    </div>
  )
})
const ExolorerFile: React.FC<{ file: PZFilePacked }> = memo((props) => {
  const { file } = props
  const { openFile } = useContext(ContentContext)
  const [t] = useTranslation()
  const extractHandler = useCallback(async () => {
    const target = await saveFile()
    if (target) {
      const result = await extractFile(file, target)
      if (result.success) {
        openExtractDialog(result.task)
      } else {
        info(errorMessage(result.error, t), t('error'), 'error')
      }
    }
  }, [file])

  return (
    <div
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
      onDoubleClick={() => openFile(file)}
    >
      <FiletypeIcon type={file.ext} size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{file.name}</div>
      <div className="text-right w-32 pr-4">{formatSize(file.size)}</div>
      <div className="text-right w-32 pr-4 text-sm">
        <PZButton type="link" onClick={extractHandler} title={t('extract file')}>
          {t('extract')}
        </PZButton>
      </div>
    </div>
  )
})
const ExplorerList: React.FC<{ current: string, files: PZFilePacked[], folders: PZFolder[] }> = memo((props) => {
  return (
    <div className="flex-1 auto-scrollbar">
      {props.folders
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((f) => (
          <ExolorerFolder key={f.id} folder={f} />
        ))}
      {props.files
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((f) => (
          <ExolorerFile key={f.fullname} file={f} />
        ))}
    </div>
  )
})
const ExplorerInfo: React.FC<{ current: string, files: PZFilePacked[], folders: PZFolder[] }> = memo((props) => {
  const [t] = useTranslation()
  const { status } = useContext(ExplorerContext)

  return (
    <div className="flex flex-row border-t px-4 py-1 border-neutral-400 dark:border-neutral-700 dark:text-gray-50">
      <div className="flex-1 flex items-center">
        <span>{t('##_folders', { count: props.folders.length })}</span>
        <ExplorerInfoSeparator />
        <span>{t('##_files', { count: props.files.length })}</span>
        <ExplorerInfoSeparator />
        <span>{formatSize(status.size)}</span>
        <ExplorerInfoSeparator />
        <span>{t('pack version ##', { version: status.version })}</span>
        <ExplorerInfoSeparator />
        <span>{status.filename}</span>
      </div>
    </div>
  )
})

const ExplorerContent = () => {
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState<PZFilePacked[]>([])
  const [folders, setFolders] = useState<PZFolder[]>([])
  const { hash, port } = useContext(ExplorerContext)

  useEffect(() => {
    loadIndex('').then(res => {
      if (res.success) {
        setCurrentPath('')
        setFiles(res.data.files)
        setFolders(res.data.folders)
      }
    })
  }, [])
  const openFolder = async (path: string) => {
    const res = await loadIndex(path)
    if (res.success) {
      setCurrentPath(path)
      setFiles(res.data.files)
      setFolders(res.data.folders)
    }
  }
  const openFile = useCallback((initFile: PZFilePacked) => {
    if (isImageFile(initFile)) {
      openModal(<ImageViewer hash={hash} port={port} files={files} initFile={initFile} />)
    } else if ( isVideoFile(initFile)) {
      openModal(<VideoPlayer hash={hash} port={port} video={initFile} />)
    }
  }, [hash, port, files])

  const context: ContentContextType = {
    navigate: (path: string) => openFolder(path),
    openFile
  }
  return (
    <div className="w-full h-full flex flex-col">
      <ContentContext.Provider value={context}>
        <Breadcrumbs current={currentPath} />
        <ExplorerList current={currentPath} files={files} folders={folders} />
        <ExplorerInfo current={currentPath} files={files} folders={folders} />
      </ContentContext.Provider>
    </div>
  )
}

type PZFileExplorerProps = {
  hash: string
  port: number
  status: PZLoaderStatus
}
export const PZFileExplorer: React.FC<PZFileExplorerProps> = memo((props) => {
  const { port, status, hash } = props

  return (
    <ExplorerContext.Provider value={{ port, status, hash }}>
      <ExplorerContent />
    </ExplorerContext.Provider>
  )
})
