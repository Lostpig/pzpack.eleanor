import React, { useContext, useEffect, useRef } from 'react'
import type { PZVideo, PZFolder } from 'pzpack'
import { MediaPlayer } from 'dashjs'
import { ModalContext, useModalManager } from '../common'
import { PZButton } from '../shared'
import { CloseLargeIcon } from '../icons'

export const VideoPlayer: React.FC<{ server: PZVideo.PZMVSimpleServer; video: PZFolder }> = ({ server, video }) => {
  const ref = useRef<HTMLVideoElement>(null)
  const { id } = useContext(ModalContext)
  const { closeModal } = useModalManager()

  useEffect(() => {
    if (!server.running) server.start()
    if (ref.current) {
      const url = `http://localhost:${server.port}/${video.id}/play.mpd`
      const player = MediaPlayer().create()
      player.initialize(ref.current, url, true)

      return () => {
        player.destroy()
      }
    }
    return () => {}
  }, [ref.current, server, video])

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
      <div className="w-full h-full overflow-hidden flex justify-center items-center">
        <video className="max-h-full max-w-full" ref={ref} controls></video>
      </div>
    </div>
  )
}
