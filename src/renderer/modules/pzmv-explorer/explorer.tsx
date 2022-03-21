import React, { createContext, memo, useCallback, useContext, useEffect, useState } from 'react'
import type { PZLoader, PZFolder } from 'pzpack'
import naturalCompare from 'natural-compare-lite'
import { FiletypeIcon } from '../icons'
import { useModalManager } from '../common'
import { formatSize, formatTime, parseVideoTime } from '../../utils'
import { VideoPlayer } from './video-player'

type ExplorerContextType = {
  openVideoPlayer: (video: PZFolder) => void
}
const ExplorerContext = createContext({} as ExplorerContextType)

const ExolorerVideo: React.FC<{ loader: PZLoader; folder: PZFolder }> = memo(({ loader, folder }) => {
  const [time, setTime] = useState(formatTime(0))
  const { openVideoPlayer } = useContext(ExplorerContext)
  const openVideo = useCallback(() => {
    openVideoPlayer(folder)
  }, [openVideoPlayer])

  useEffect(() => {
    parseVideoTime(loader, folder).then((t) => {
      setTime(formatTime(t))
    })
  }, [loader, folder.id])

  return (
    <div
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
      onDoubleClick={openVideo}
    >
      <FiletypeIcon type={'.mp4'} size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{folder.name}</div>
      <div className="text-right w-32 pr-4">{time}</div>
    </div>
  )
})
const ExplorerList: React.FC<{ loader: PZLoader }> = memo(({ loader }) => {
  const idx = loader.loadIndex()
  const children = idx.getChildren(idx.root)

  return (
    <div className="flex-1 overflow-auto">
      {children.folders
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((f) => (
          <ExolorerVideo key={f.id} folder={f} loader={loader} />
        ))}
    </div>
  )
})
const ExplorerInfo: React.FC<{ loader: PZLoader }> = memo(({ loader }) => {
  const idx = loader.loadIndex()
  const children = idx.getChildren(idx.root)

  return (
    <div className="flex flex-row border-t border-neutral-400 dark:border-neutral-700 dark:text-gray-50">
      <div className="flex-1">
        <span>{children.folders.length} videos</span>
      </div>
      <div className="text-right">
        <span>{loader.filename}</span>|<span>{formatSize(loader.size)}</span>
      </div>
    </div>
  )
})

export const PZVideoExplorer: React.FC<{ loader: PZLoader }> = memo(({ loader }) => {
  const { openModal } = useModalManager()
  const openVideoPlayer = (video: PZFolder) => {
    openModal(<VideoPlayer loader={loader} video={video} />)
  }

  return (
    <div className="w-full h-full flex flex-col pt-4">
      <ExplorerContext.Provider value={{ openVideoPlayer }}>
        <ExplorerList loader={loader} />
        <ExplorerInfo loader={loader} />
      </ExplorerContext.Provider>
    </div>
  )
})
