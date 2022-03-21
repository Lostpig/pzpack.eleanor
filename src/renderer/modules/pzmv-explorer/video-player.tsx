import React, { useContext, useEffect, useRef } from 'react'
import { PZVideo, type PZFolder, type PZLoader } from 'pzpack'
import { MediaPlayer } from 'dashjs'
import { ModalContext, useModalManager } from '../common'
import { PZButton } from '../shared'
import { CloseLargeIcon } from '../icons'

export const createPlayerServer = (loader: PZLoader, video: PZFolder) => {
  const server = new PZVideo.PZMVSimpleServer(loader)
  const close = () => server.close()

  server.start()
  const port = server.port
  const url = `http://localhost:${port}/${video.id}/play.mpd`

  return {
    url,
    close,
  }
}

export const VideoPlayer: React.FC<{ loader: PZLoader; video: PZFolder }> = ({ loader, video }) => {
  const ref = useRef<HTMLVideoElement>(null)
  const { id } = useContext(ModalContext)
  const { closeModal } = useModalManager()

  useEffect(() => {
    if (ref.current) {
      const { url, close: closeServer } = createPlayerServer(loader, video)
      const player = MediaPlayer().create()
      player.initialize(ref.current, url, true)

      return () => {
        closeServer()
        player.destroy()
      }
    }
    return () => {}
  }, [ref.current, loader, video])

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
