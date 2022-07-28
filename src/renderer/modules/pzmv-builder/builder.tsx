import React, { memo, useContext, createContext, useMemo, useEffect, useReducer, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { PZVideo } from 'pzpack'
import naturalCompare from 'natural-compare-lite'
import { info, openSetNameDialog } from '../common'
import { FiletypeIcon } from '../icons'
import { PZButton } from '../shared'
import { RendererLogger } from '../../service/logger'
import { selectVideos } from '../../service/io'
import { openBuildDialog } from './dialogs'

type BuilderContextType = {
  builder: PZVideo.PZMVIndexBuilder
}
const BuilderContext = createContext<BuilderContextType>({} as BuilderContextType)

const BuilderVideo: React.FC<{ video: PZVideo.PZMVIndexFile }> = memo(({ video }) => {
  const { builder } = useContext(BuilderContext)
  const [t] = useTranslation()
  const deleteHandler = useCallback(() => {
    builder.removeVideo(video.source)
  }, [video, builder])
  const renameHandler = useCallback(() => {
    const sub = openSetNameDialog(video.name)
    sub.subscribe((name) => {
      if (name) builder.renameVideo(video.name, name)
    })
  }, [video, builder])

  return (
    <div
      title={`${t('source')}: ${video.source}`}
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
    >
      <FiletypeIcon type={'.mp4'} size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{video.name}</div>
      <div className="text-right pr-4">
        <PZButton type="link" onClick={renameHandler}>
          {t('rename')}
        </PZButton>
        <PZButton type="link" onClick={deleteHandler}>
          {t('delete')}
        </PZButton>
      </div>
    </div>
  )
})
const BuilderList: React.FC<{ update: number }> = memo(({ update }) => {
  const { builder } = useContext(BuilderContext)
  const videos = useMemo(() => builder.getList(), [builder, update])

  return (
    <div className="flex-1 auto-scrollbar">
      {videos
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((v) => (
          <BuilderVideo key={v.source} video={v} />
        ))}
    </div>
  )
})
const BuilderOperateBar: React.FC = memo(() => {
  const [t] = useTranslation()
  const { builder } = useContext(BuilderContext)

  const addVideos = useCallback(() => {
    selectVideos().then((files) => {
      for (const file of files) {
        builder.addVideo(file)
      }
    })
  }, [builder])
  const toBuild = useCallback(() => {
    try {
      builder.checkEmpty()
      openBuildDialog(builder)
    } catch (err) {
      const msg = (err as Error)?.message ?? 'unknown error'
      info(msg, t('error'), 'error')
    }
  }, [builder])

  return (
    <div className="flex flex-row border-t px-4 py-1 border-neutral-400 dark:border-neutral-700 dark:text-gray-50">
      <div className="flex-1">
        <PZButton type="normal" onClick={addVideos}>
          {t('add videos')}
        </PZButton>
      </div>
      <div>
        <PZButton type="primary" onClick={toBuild}>
          {t('pack')}
        </PZButton>
      </div>
    </div>
  )
})

const BuilderContent = () => {
  const { builder } = useContext(BuilderContext)
  const [updateFlag, dispatchFlag] = useReducer((prev) => prev + 1, 0)

  useEffect(() => {
    const subscription = builder.subscriber.subscribe(() => {
      RendererLogger.debug('PZMV builder update')
      dispatchFlag()
    })
    return () => subscription.unsubscribe()
  }, [builder, dispatchFlag])

  return (
    <div className="w-full h-full flex flex-col pt-4">
        <BuilderList update={updateFlag} />
        <BuilderOperateBar />
    </div>
  )
}

export const PZMVBuilder: React.FC<{ builder: PZVideo.PZMVIndexBuilder }> = memo(({ builder }) => {
  return (
    <BuilderContext.Provider value={{ builder }}>
      <BuilderContent />
    </BuilderContext.Provider>
  )
})
