import React, { createContext, memo, useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PZFolder, PZIndexReader } from 'pzpack'
import naturalCompare from 'natural-compare-lite'

import type { PZLoaderStatus } from '../../../lib/declares'
import { FiletypeIcon } from '../icons'
import { useModalManager, useExternalPlayer, useInfoDialog } from '../common'
import { formatSize, formatTime, parseVideoTime, createUrl } from '../../utils'
import { VideoPlayer } from './video-player'
import { PZButton } from '../shared'

type ExplorerContextType = {
  indices: PZIndexReader
  status: PZLoaderStatus
  port: number
  openVideoPlayer: (video: PZFolder) => void
}
const ExplorerContext = createContext({} as ExplorerContextType)

const ExplorerInfoSeparator = () => {
  return <div className="mx-3 w-px h-4/5 bg-neutral-400"></div>
}
const ExolorerVideo: React.FC<{ folder: PZFolder }> = memo(({ folder }) => {
  const [t] = useTranslation()
  const [time, setTime] = useState(formatTime(0))
  const { openVideoPlayer, port } = useContext(ExplorerContext)
  const info = useInfoDialog()
  const { checkExternalPlayer, openExternalPlayer } = useExternalPlayer()
  const openVideo = useCallback(() => {
    openVideoPlayer(folder)
  }, [openVideoPlayer])
  const openExPlayer = useCallback(() => {
    checkExternalPlayer().then((exists) => {
      if (exists) {
        const url = createUrl(port, folder.id, 'play.mpd')
        openExternalPlayer(url)
      } else {
        info(t('external player not setted'), t('warning'), 'warning')
      }
    })
  }, [checkExternalPlayer, openExternalPlayer, folder])

  useEffect(() => {
    parseVideoTime(port, folder).then((vtime) => {
      setTime(formatTime(vtime))
    })
  }, [port, folder.id])

  return (
    <div
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
      onDoubleClick={openVideo}
    >
      <FiletypeIcon type={'.mp4'} size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{folder.name}</div>
      <div className="text-right w-32 pr-4">
        <PZButton type="link" onClick={openExPlayer}>
          {t('play')}
        </PZButton>
      </div>
      <div className="text-right w-32 pr-4">{time}</div>
    </div>
  )
})
const ExplorerList: React.FC = memo(() => {
  const { indices } = useContext(ExplorerContext)
  const { folders } = indices.getChildren(indices.root)

  return (
    <div className="flex-1 auto-scrollbar">
      {folders
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((f) => (
          <ExolorerVideo key={f.id} folder={f} />
        ))}
    </div>
  )
})
const ExplorerInfo: React.FC = memo(() => {
  const [t] = useTranslation()
  const { indices, status } = useContext(ExplorerContext)
  const { folders } = indices.getChildren(indices.root)

  return (
    <div className="flex flex-row border-t px-4 py-1 border-neutral-400 dark:border-neutral-700 dark:text-gray-50">
      <div className="flex-1 flex items-center">
        <span>{t('##_videos', { count: folders.length })}</span>
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

type PZVideoExplorerProps = {
  indices: PZIndexReader
  port: number
  status: PZLoaderStatus
}
export const PZVideoExplorer: React.FC<PZVideoExplorerProps> = memo((props) => {
  const { indices, port, status } = props
  const { openModal } = useModalManager()
  const openVideoPlayer = (video: PZFolder) => {
    openModal(<VideoPlayer video={video} port={port} />)
  }

  return (
    <div className="w-full h-full flex flex-col pt-4">
      <ExplorerContext.Provider value={{ indices, port, status, openVideoPlayer }}>
        <ExplorerList />
        <ExplorerInfo />
      </ExplorerContext.Provider>
    </div>
  )
})
