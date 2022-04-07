import React, { useCallback, useContext, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { PZFolder } from 'pzpack'
import { MediaPlayer } from 'dashjs'

import { ModalContext, useModalManager, useExternalPlayer, useInfoDialog } from '../common'
import { PZButton } from '../shared'
import { CloseLargeIcon } from '../icons'
import { createFileUrl } from '../../utils'

export const VideoPlayer: React.FC<{ port: number, hash: string, video: PZFolder }> = ({ port, hash, video }) => {
  const [t] = useTranslation()
  const ref = useRef<HTMLVideoElement>(null)
  const { id } = useContext(ModalContext)
  const { closeModal } = useModalManager()
  const info = useInfoDialog()
  const { checkExternalPlayer, openExternalPlayer } = useExternalPlayer()

  useEffect(() => {
    if (ref.current) {
      const url = createFileUrl(port, hash, video.id, 'play.mpd')
      const player = MediaPlayer().create()

      let errorShowed = false
      player.on('error', () => {
        if (errorShowed) return
        info(t('not support codec try to use external player'), t('warning'), 'warning')
        player.pause()
        errorShowed = true
      })
      player.initialize(ref.current, url, true)

      return () => {
        player.destroy()
      }
    }
    return () => {}
  }, [ref.current, port, video])
  const openExPlayer = useCallback(() => {
    checkExternalPlayer().then((exists) => {
      if (exists) {
        const url = createFileUrl(port, hash, video.id, 'play.mpd')
        openExternalPlayer(url)
        if (ref.current) ref.current.pause()
      } else {
        info(t('external player not setted'), t('warning'), 'warning')
      }
    })
  },[checkExternalPlayer, openExternalPlayer, port, video, ref.current])

  return (
    <div className="absolute top-0 left-0 w-screen h-screen bg-white dark:bg-neutral-700">
      <header className="pzview-header electron-nodrag absolute top-0 left-0 w-full h-16 pb-8 z-10">
        <div className="content bg-white/70 dark:bg-neutral-800/70 flex flex-row h-8 items-center">
          <div className="flex-1 text-black dark:text-gray-50 pl-4">{video.name}</div>
          <PZButton type="icon" onClick={() => closeModal(id)} className="hover:text-red-600">
            <CloseLargeIcon size={24} />
          </PZButton>
        </div>
      </header>
      <div className="w-full h-full flex flex-col overflow-hidden items-center">
        <div className="flex-1 flex items-center justify-center" style={({ height: 'calc(100% - 10rem)' })}>
          <video className="max-h-full max-w-full" ref={ref} controls></video>
        </div>
        <div className="flex h-8 items-center">
          <PZButton type="link" onClick={openExPlayer}>
            {t('open with external player')}
          </PZButton>
        </div>
      </div>
    </div>
  )
}
