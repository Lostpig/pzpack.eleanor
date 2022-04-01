import React, { useState, useContext, useRef, useEffect, useCallback, memo, createContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PZVideo } from 'pzpack'
import { mergeCls, formatTime } from '../../utils'
import { useModalManager, ModalContext, DialogBase, useIoService, useInfoDialog } from '../common'
import { PZText, PZButton, PZPassword, PZSelect, PZProgress } from '../shared'
import { useAudioCodec, useVideoCodec, useBuilder } from './hooks'
import { RendererLogger } from '../../service/logger'
import type { IPCTask } from '../../service/pzpack'

// #region BuildingDialog
type BuildingDialogProps = {
  start: number
  task: IPCTask<PZVideo.PZMVProgress>
}

const BuildingStagePanel: React.FC<{ progress: PZVideo.PZMVProgress }> = ({ progress }) => {
  const [t] = useTranslation()
  let content: JSX.Element
  if (progress.stage === 'ffmpeg') {
    const innerProgress = progress.progress
    content = (
      <div>
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('build stage')}</label>
          <span>{t('ffmpeg stage')}</span>
        </div>
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('file')}</label>
          <span>
            {progress.count} / {progress.total}
          </span>
        </div>
        <div className="mb-1">
          <label>{t('current progress')}</label>
        </div>
        <div className="mb-1">
          <PZProgress value={innerProgress.percent} total={100} />
        </div>
      </div>
    )
  } else if (progress.stage === 'pzbuild') {
    const innerProgress = progress.progress
    content = (
      <div>
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('build stage')}</label>
          <span>{t('pzmv build stage')}</span>
        </div>
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('file')}</label>
          <span>
            {innerProgress.count[0]} / {innerProgress.count[1]}
          </span>
        </div>
        <div className="mb-1">
          <label>{t('current progress')}</label>
        </div>
        <div className="mb-1">
          <PZProgress value={innerProgress.current[0] ?? 0} total={innerProgress.current[1] ?? 0} />
        </div>
        <div className="mb-1">
          <label>{t('total progress')}</label>
        </div>
        <div className="mb-3">
          <PZProgress value={innerProgress.total[0] ?? 0} total={innerProgress.total[1] ?? 0} />
        </div>
      </div>
    )
  } else {
    content = (
      <div>
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('build stage')}</label>
          <span>{t('clean temp files')}</span>
        </div>
      </div>
    )
  }

  return content
}
const BuildingDialog = (props: BuildingDialogProps) => {
  const { task } = props
  const [t] = useTranslation()
  const [usedTime, setUsedTime] = useState(formatTime(0))
  const { closeModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const [progress, setProgress] = useState<PZVideo.PZMVProgress>()
  const info = useInfoDialog()
  const completeHandle = useCallback(
    (cop: { canceled: boolean }) => {
      closeModal(id)

      if (cop.canceled) {
        info(t('building canceled'))
      } else {
        const time = (Date.now() - props.start) / 1000
        const message = t('mvbuild complete message ##', { time: formatTime(time) })
        info(message, t('build complete'))
      }
    },
    [info, closeModal, id],
  )
  useEffect(() => {
    let completeBind = completeHandle
    const subscription = task.addReporter((p: PZVideo.PZMVProgress) => {
      setProgress(p)
      const second = (Date.now() - props.start) / 1000
      setUsedTime(formatTime(second))
    })
    task.complete.then((p) => {
      completeBind(p)
    })

    return () => {
      subscription.unsubscribe()
      completeBind = () => {}
    }
  }, [task])

  return (
    <DialogBase>
      <div className="flex flex-col" style={{ width: '600px' }}>
        <div className="mt-1 mb-3">
          <label className="font-bold">{t('building')}</label>
        </div>
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('used time')}</label>
          <span>{usedTime}</span>
        </div>
        {progress ? <BuildingStagePanel progress={progress} /> : null}
        <div className="flex flex-row justify-end">
          <PZButton onClick={() => task.cancel()}>{t('cancel')}</PZButton>
        </div>
      </div>
    </DialogBase>
  )
}
// #endregion

// #region ToBuildDialog
type MVBuildContextType = {
  dispatchVideoCodec: (codec: PZVideo.VideoCodecParam) => void
  dispatchAudioCodec: (codec: PZVideo.AudioCodecParam) => void
}
const MVBuildContext = createContext<MVBuildContextType>({} as MVBuildContextType)
const nvencOptions: { name: keyof PZVideo.VNvencParams; options: string[] }[] = [
  {
    name: 'preset',
    options: ['default', 'slow', 'medium', 'fast', 'hp', 'hq', 'bd', 'll', 'llhq', 'llhp', 'lossless', 'losslesshp'],
  },
  { name: 'profile', options: ['main', 'main10', 'rext'] },
  { name: 'tier', options: ['main', 'high'] },
]
const libx265Options: { name: keyof PZVideo.VLibx265Params; options: string[] }[] = [
  {
    name: 'preset',
    options: [
      'ultrafast',
      'superfast',
      'veryfast',
      'faster',
      'fast',
      'medium',
      'slow',
      'slower',
      'veryslow',
      'placebo',
    ],
  },
  { name: 'profile', options: ['main', 'main444-8', 'main10', 'main422-10', 'main444-10'] },
  { name: 'tune', options: ['none', 'psnr', 'ssim', 'grain', 'fastdecode', 'zerolatency', 'animation'] },
]

type nvencChange = <T extends keyof PZVideo.VNvencParams>(field: T, value: PZVideo.VNvencParams[T]) => void
const VideoNvencPanel = (props: { codec: PZVideo.VNvencParams }) => {
  const { codec } = props
  const { dispatchVideoCodec } = useContext(MVBuildContext)
  const selectChange: nvencChange = useCallback(
    (field, value) => {
      if (codec[field] === value) return

      const patch: PZVideo.VNvencParams = { encoder: 'nvenc' }
      patch[field] = value
      dispatchVideoCodec(patch)
    },
    [dispatchVideoCodec, codec],
  )
  const rcField = codec.rc === 'constqp' ? 'qp' : codec.rc === 'vbr' || codec.rc === 'vbr_hq' ? 'cq' : 'bitrate'

  return (
    <div>
      {nvencOptions.map((p) => {
        return (
          <div key={p.name} className="mb-2 flex flex-row items-center">
            <label className="w-32 mr-6 text-right font-bold">{p.name}</label>
            <PZSelect
              className="w-40"
              value={codec[p.name]?.toString()}
              items={p.options}
              onChange={(v) => selectChange(p.name, v as any)}
            />
          </div>
        )
      })}
      <div className="mb-2 flex flex-row items-center">
        <label className="w-32 mr-6 text-right font-bold">rc</label>
        <PZSelect
          className="w-40"
          value={codec.rc}
          items={['constqp', 'vbr', 'cbr', 'cbr_ld_hq', 'cbr_hq', 'vbr_hq']}
          onChange={(v) => selectChange('rc', v as any)}
        />
        <div className="w-16"></div>
        <label className="w-32 mr-6 text-right font-bold">{rcField}</label>
        <PZText
          type="number"
          className="w-40"
          binding={codec[rcField]?.toString()}
          onChange={(v) => selectChange(rcField, v as any)}
        />
        <span className={rcField === 'bitrate' ? '' : 'hidden'}>kbps</span>
      </div>
    </div>
  )
}
type x265Change = <T extends keyof PZVideo.VLibx265Params>(field: T, value: PZVideo.VLibx265Params[T]) => void
const VideoLibx265Panel = (props: { codec: PZVideo.VLibx265Params }) => {
  const { codec } = props
  const { dispatchVideoCodec } = useContext(MVBuildContext)
  const selectChange: x265Change = useCallback(
    (field, value) => {
      if (codec[field] === value) return

      const patch: PZVideo.VLibx265Params = { encoder: 'libx265' }
      patch[field] = value
      dispatchVideoCodec(patch)
    },
    [dispatchVideoCodec, codec],
  )

  return (
    <div>
      {libx265Options.map((p) => {
        return (
          <div key={p.name} className="mb-2 flex flex-row items-center">
            <label className="w-32 mr-6 text-right font-bold">{p.name}</label>
            <PZSelect
              className="w-40"
              value={codec[p.name]?.toString()}
              items={p.options}
              onChange={(v) => selectChange(p.name, v as any)}
            />
          </div>
        )
      })}
      <div className="mb-2 flex flex-row items-center">
        <label className="w-32 mr-6 text-right font-bold">crf</label>
        <PZText
          type="number"
          className="w-40"
          value={codec.crf?.toString()}
          onChange={(v) => selectChange('crf', v as any)}
        />
      </div>
    </div>
  )
}
const VideoCodecPanel = (props: { codec: PZVideo.VideoCodecParam }) => {
  const { codec } = props
  const [t] = useTranslation()
  const { dispatchVideoCodec } = useContext(MVBuildContext)
  const selectChange = useCallback(
    (encoder: PZVideo.VideoCodecParam['encoder']) => {
      if (codec.encoder === encoder) return
      const patch: PZVideo.VideoCodecParam = { encoder }
      dispatchVideoCodec(patch)
    },
    [dispatchVideoCodec, codec],
  )

  return (
    <>
      <div>
        <div className="my-2 flex flex-row items-center">
          <label className="w-32 mr-6 text-right font-bold">{t('video codec')}</label>
          <PZSelect
            className="w-40"
            value={codec.encoder}
            items={['copy', 'nvenc', 'libx265']}
            onChange={(v) => selectChange(v as any)}
          />
        </div>
      </div>
      {codec.encoder === 'nvenc' ? (
        <VideoNvencPanel codec={codec} />
      ) : codec.encoder === 'libx265' ? (
        <VideoLibx265Panel codec={codec} />
      ) : null}
    </>
  )
}

type audioChange = <T extends keyof PZVideo.AudioCodecParam>(field: T, value: PZVideo.AudioCodecParam[T]) => void
const AudioCodecPanel = (props: { codec: PZVideo.AudioCodecParam }) => {
  const { codec } = props
  const [t] = useTranslation()
  const { dispatchAudioCodec } = useContext(MVBuildContext)
  const selectChange: audioChange = useCallback(
    (field, value) => {
      if (codec[field] === value) return
      const patch: PZVideo.AudioCodecParam = Object.assign({}, codec)
      patch[field] = value
      dispatchAudioCodec(patch)
    },
    [dispatchAudioCodec, codec],
  )

  return (
    <div>
      <div className="my-2 flex flex-row items-center">
        <label className="w-32 mr-6 text-right font-bold">{t('audio codec')}</label>
        <PZSelect
          className="w-40"
          value={codec.encoder}
          items={['copy', 'aac', 'libmp3lame']}
          onChange={(v) => selectChange('encoder', v as any)}
        />
      </div>
      <div className={mergeCls('mb-2 flex flex-row items-center', codec.encoder === 'copy' ? 'hidden' : '')}>
        <label className="w-32 mr-6 text-right font-bold">{t('bitrate')}</label>
        <PZSelect
          className="w-40"
          value={codec.bitrate}
          items={['128', '192', '256', '320']}
          onChange={(v) => selectChange('bitrate', v as any)}
        />
        <span>kbps</span>
      </div>
    </div>
  )
}

type ToBuildDialogProps = {
  indexBuilder: PZVideo.PZMVIndexBuilder
}
const ToBuildDialog = memo(({ indexBuilder }: ToBuildDialogProps) => {
  const [t] = useTranslation()
  const [target, setTarget] = useState('')
  const [msg, setMsg] = useState('')
  const { closeModal, openModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const { saveVideo } = useIoService()
  const [videoCodec, dispatchVideoCodec] = useVideoCodec()
  const [audioCodec, dispatchAudioCodec] = useAudioCodec()
  const context = useMemo(() => ({ dispatchVideoCodec, dispatchAudioCodec }), [dispatchVideoCodec, dispatchAudioCodec])
  const descRef = useRef<HTMLInputElement>(null)
  const pwRef = useRef<HTMLInputElement>(null)
  const { startPZMVBuild } = useBuilder()

  useEffect(() => {
    descRef.current?.focus()
  }, [])
  const saveTarget = useCallback(() => {
    saveVideo().then((f) => {
      if (f) setTarget(f)
    })
  }, [saveVideo])
  const pwFocus = useCallback(() => pwRef.current?.focus(), [pwRef.current])
  const startBuild = useCallback(() => {
    const pw = pwRef.current?.value
    const desc = descRef.current?.value ?? ''
    if (!pw) return setMsg(t('password cannot be empty'))
    if (!target) return setMsg(t('save target cannot be empty'))

    startPZMVBuild(target, { indexBuilder, password: pw, description: desc, videoCodec, audioCodec })
      .then((result) => {
        if (result.success) {
          openModal(<BuildingDialog task={result.task} start={Date.now()} />)
          closeModal(id)
        } else {
          setMsg(result.message ?? t('unknown error'))
        }
      })
      .catch((err) => {
        RendererLogger.errorStack(err)
        setMsg(err?.message ?? t('unknown error'))
      })
  }, [indexBuilder, target, videoCodec, audioCodec, descRef.current, pwRef.current])

  return (
    <DialogBase>
      <MVBuildContext.Provider value={context}>
        <div className="flex flex-col" style={{ width: '750px' }}>
          <div className="mt-1 mb-4">
            <label className="w-16 mr-6 text-right font-bold">{t('build')}</label>
          </div>
          <div className="mb-2 flex flex-row items-center">
            <div className="w-32 mr-6 text-right">
              <PZButton type="normal" onClick={saveTarget}>
                {t('save to')}
              </PZButton>
            </div>
            <span className="flex-1">{target}</span>
          </div>
          <div className="mb-2 flex flex-row items-center">
            <label className="w-32 mr-6 text-right font-bold">{t('description')}</label>
            <PZText ref={descRef} className="flex-1" onEnter={() => pwFocus()} />
          </div>
          <div className="mb-2 flex flex-row items-center">
            <label className="w-32 mr-6 text-right font-bold">{t('password')}</label>
            <PZPassword ref={pwRef} className="flex-1" />
          </div>
          <hr />
          <VideoCodecPanel codec={videoCodec} />
          <hr />
          <AudioCodecPanel codec={audioCodec} />
          <div className={mergeCls('mb-4 text-right', msg ? 'block' : 'hidden')}>
            <span className="text-red-600">{msg}</span>
          </div>
          <div className="flex flex-row justify-end">
            <PZButton type="primary" onClick={() => startBuild()}>
              {t('build')}
            </PZButton>
            <PZButton onClick={() => closeModal(id)}>{t('cancel')}</PZButton>
          </div>
        </div>
      </MVBuildContext.Provider>
    </DialogBase>
  )
})
// #endregion

export const useBuilderDialogs = () => {
  const { openModal } = useModalManager()
  const openBuildDialog = useCallback(
    (indexBuilder: PZVideo.PZMVIndexBuilder) => openModal(<ToBuildDialog indexBuilder={indexBuilder} />),
    [openModal],
  )

  return {
    openBuildDialog,
  }
}
