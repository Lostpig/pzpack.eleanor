import React, { createContext, memo, useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PZFolder, PZVideo } from 'pzpack'
import naturalCompare from 'natural-compare-lite'
import { FiletypeIcon } from '../icons'
import { useModalManager, useExternalPlayer, useInfoDialog } from '../common'
import { formatSize, formatTime, parseVideoTime } from '../../utils'
import { VideoPlayer } from './video-player'
import { PZButton } from '../shared'

type ExplorerContextType = {
  openVideoPlayer: (video: PZFolder) => void
}
const ExplorerContext = createContext({} as ExplorerContextType)

const ExplorerInfoSeparator = () => {
  return <div className="mx-3 w-px h-4/5 bg-neutral-400"></div>
}
const ExolorerVideo: React.FC<{ server: PZVideo.PZMVSimpleServer; folder: PZFolder }> = memo(({ server, folder }) => {
  const [t] = useTranslation()
  const [time, setTime] = useState(formatTime(0))
  const { openVideoPlayer } = useContext(ExplorerContext)
  const info = useInfoDialog()
  const { checkExternalPlayer, openExternalPlayer } = useExternalPlayer()
  const openVideo = useCallback(() => {
    openVideoPlayer(folder)
  }, [openVideoPlayer])
  const openExPlayer = useCallback(() => {
    checkExternalPlayer().then((exists) => {
      if (exists) {
        const url = `http://localhost:${server.port}/${folder.id}/play.mpd`
        openExternalPlayer(url, server)
      } else {
        info(t('external player not setted'), t('warning'), 'warning')
      }
    })
  },[checkExternalPlayer, openExternalPlayer, server, folder])

  useEffect(() => {
    parseVideoTime(server.loader, folder).then((vtime) => {
      setTime(formatTime(vtime))
    })
  }, [server, folder.id])

  return (
    <div
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
      onDoubleClick={openVideo}
    >
      <FiletypeIcon type={'.mp4'} size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{folder.name}</div>
      <div className="text-right w-32 pr-4">
        <PZButton type='link' onClick={openExPlayer}>{t('play')}</PZButton>
      </div>
      <div className="text-right w-32 pr-4">{time}</div>
    </div>
  )
})
const ExplorerList: React.FC<{ server: PZVideo.PZMVSimpleServer }> = memo(({ server }) => {
  const videos = server.getVideoFolders()

  return (
    <div className="flex-1 auto-scrollbar">
      {videos
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((f) => (
          <ExolorerVideo key={f.id} folder={f} server={server} />
        ))}
    </div>
  )
})
const ExplorerInfo: React.FC<{ server: PZVideo.PZMVSimpleServer }> = memo(({ server }) => {
  const [t] = useTranslation()
  const videos = server.getVideoFolders()

  return (
    <div className="flex flex-row border-t px-4 py-1 border-neutral-400 dark:border-neutral-700 dark:text-gray-50">
      <div className="flex-1 flex items-center">
        <span>{t('##_videos', { count: videos.length })}</span>
        <ExplorerInfoSeparator />
        <span>{formatSize(server.loader.size)}</span>
        <ExplorerInfoSeparator />
        <span>{t('pack version ##', { version: server.loader.version })}</span>
        <ExplorerInfoSeparator />
        <span>{t('pack type ##', { type: server.loader.type })}</span>
        <ExplorerInfoSeparator />
        <span>{server.loader.filename}</span>
      </div>
    </div>
  )
})

export const PZVideoExplorer: React.FC<{ server: PZVideo.PZMVSimpleServer }> = memo(({ server }) => {
  const { openModal } = useModalManager()
  const openVideoPlayer = (video: PZFolder) => {
    openModal(<VideoPlayer server={server} video={video} />)
  }

  return (
    <div className="w-full h-full flex flex-col pt-4">
      <ExplorerContext.Provider value={{ openVideoPlayer }}>
        <ExplorerList server={server} />
        <ExplorerInfo server={server} />
      </ExplorerContext.Provider>
    </div>
  )
})
