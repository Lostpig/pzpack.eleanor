import React, { useCallback, useContext, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { PZFilePacked } from 'pzpack'

import { ModalContext, info } from '../common'
import { PZButton } from '../shared'
import { CloseLargeIcon } from '../icons'
import { createFileUrl } from '../../utils'
import { closeModal } from '../../service/modal'
import { externalPlayerExists, openExternalPlayer } from '../../service/config'

export const VideoPlayer: React.FC<{ port: number; hash: string; video: PZFilePacked }> = ({ port, hash, video }) => {
  const [t] = useTranslation()
  const ref = useRef<HTMLVideoElement>(null)
  const { id } = useContext(ModalContext)
  const url = createFileUrl(port, hash, video)

  useEffect(() => {
    if (ref.current) {
      const player = ref.current

      let errorShowed = false
      const errHandler = () => {
        if (errorShowed) return
        info(t('not support codec try to use external player'), t('warning'), 'warning')
        player.pause()
        errorShowed = true
      }
      player.addEventListener('error', errHandler)
      player.play()

      return () => {
        player.removeEventListener('error', errHandler)
      }
    }
    return () => {}
  }, [ref.current, port, video])
  const openExPlayer = useCallback(() => {
    externalPlayerExists().then((exists) => {
      if (exists) {
        openExternalPlayer(url)
        if (ref.current) ref.current.pause()
      } else {
        info(t('external player not setted'), t('warning'), 'warning')
      }
    })
  }, [port, video, ref.current])

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
        <div className="flex-1 flex items-center justify-center" style={{ height: 'calc(100% - 10rem)' }}>
          <video className="max-h-full max-w-full" ref={ref} controls>
            <source src={url} />
          </video>
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
