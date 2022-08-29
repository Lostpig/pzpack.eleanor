import React, { useState, useContext, useRef, useEffect, useCallback, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PZIndexBuilder, BuildProgress, PZTask } from 'pzpack'

import { mergeCls, formatTime, formatFileSize, defFilters, errorMessage } from '../../utils'
import { ModalContext, DialogBase, info } from '../common'
import { PZButton, PZPassword, PZProgress, PZSelect } from '../shared'
import { startPZBuild } from '../../service/pzpack'
import { saveFile } from '../../service/io'
import { openModal, closeModal } from '../../service/modal'

type BuildingDialogProps = {
  start: number
  task: PZTask.AsyncTask<BuildProgress>
}
const BuildingDialog = (props: BuildingDialogProps) => {
  const { task } = props
  const [t] = useTranslation()
  const [usedTime, setUsedTime] = useState(formatTime(0))
  const { id } = useContext(ModalContext)
  const [progress, setProgress] = useState<BuildProgress>()
  const taskObs = useMemo(() => task.observable(), [task])

  const completeHandle = useCallback(
    (taskState: { canceled: boolean; error?: Error }) => {
      closeModal(id)

      if (taskState.error) {
        info(errorMessage(taskState.error, t), t('error'), 'error')
      }
      if (taskState.canceled) {
        info(t('building canceled'))
      } else {
        const time = (Date.now() - props.start) / 1000
        const bytes = formatFileSize(taskObs.current.sumWrittenBytes)
        const speed = formatFileSize(taskObs.current.sumWrittenBytes / time)

        const message = t('build complete message ##', { time: formatTime(time), bytes, speed })
        info(message, t('build complete'))
      }
    },
    [info, id, taskObs],
  )
  useEffect(() => {
    const subscription = taskObs.subscribe(
      (p: BuildProgress) => {
        setProgress(p)
        const second = (Date.now() - props.start) / 1000
        setUsedTime(formatTime(second))
      },
      (err) => {
        completeHandle({ canceled: false, error: err })
      },
      () => {
        completeHandle({ canceled: task.canceled })
      },
    )

    return () => subscription.unsubscribe()
  }, [taskObs])

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
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('file')}</label>
          <span>
            {progress?.filePackedCount} / {progress?.fileTotalCount}
          </span>
        </div>
        <div className="mb-1">
          <label>{t('current progress')}</label>
        </div>
        <div className="mb-1">
          <PZProgress value={progress?.currentWrittenBytes ?? 0} total={progress?.currentTotalBytes ?? 0} />
        </div>
        <div className="mb-1">
          <label>{t('total progress')}</label>
        </div>
        <div className="mb-3">
          <PZProgress value={progress?.sumWrittenBytes ?? 0} total={progress?.sumTotalBytes ?? 0} />
        </div>
        <div className="flex flex-row justify-end">
          <PZButton onClick={() => task.cancel()}>{t('cancel')}</PZButton>
        </div>
      </div>
    </DialogBase>
  )
}

const blockSizeList = [
  { name: '64 KB', value: 64 * 1024 },
  { name: '128 KB', value: 128 * 1024 },
  { name: '256 KB', value: 256 * 1024 },
  { name: '512 KB', value: 512 * 1024 },
  { name: '1 MB', value: 1024 * 1024 },
  { name: '4 MB', value: 4 * 1024 * 1024 },
  { name: '8 MB', value: 8 * 1024 * 1024 },
  { name: '16 MB', value: 16 * 1024 * 1024 },
  { name: '32 MB', value: 32 * 1024 * 1024 },
  { name: '64 MB', value: 64 * 1024 * 1024 },
]
type ToBuildDialogProps = {
  indexBuilder: PZIndexBuilder
}
const ToBuildDialog = memo((props: ToBuildDialogProps) => {
  const [t] = useTranslation()
  const [target, setTarget] = useState('')
  const [msg, setMsg] = useState('')
  const { id } = useContext(ModalContext)
  const [blockSize, setBlockSize] = useState(blockSizeList[4].value)
  const pwRef = useRef<HTMLInputElement>(null)

  const saveTarget = useCallback(() => {
    saveFile([defFilters.PZPack]).then((f) => {
      if (f) setTarget(f)
    })
  }, [])
  const blockSizeChange = useCallback((val: string) => {
    const bsize = parseInt(val, 10)
    setBlockSize(bsize)
  }, [])

  const startBuild = useCallback(() => {
    const pw = pwRef.current?.value
    if (!pw) return setMsg(t('password cannot be empty'))
    if (!target) return setMsg(t('save target cannot be empty'))

    startPZBuild(props.indexBuilder, target, blockSize, pw)
      .then((result) => {
        if (result.success) {
          openModal(<BuildingDialog task={result.task} start={Date.now()} />)
          closeModal(id)
        } else {
          setMsg(errorMessage(result.error, t))
        }
      })
      .catch((err) => {
        setMsg(errorMessage(err, t))
      })
  }, [target, pwRef.current])

  return (
    <DialogBase>
      <div className="flex flex-col" style={{ width: '750px' }}>
        <div className="mt-1 mb-3">
          <label className="w-16 mr-6 text-right font-bold">{t('build')}</label>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <div className="w-32 mr-6 text-right">
            <PZButton type="normal" onClick={saveTarget}>
              {t('save to')}
            </PZButton>
          </div>
          <span className="flex-1">{target}</span>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <label className="w-32 mr-6 text-right font-bold">{t('block size')}</label>
          <PZSelect value={blockSize} items={blockSizeList} onChange={blockSizeChange}></PZSelect>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <label className="w-32 mr-6 text-right font-bold">{t('password')}</label>
          <PZPassword ref={pwRef} className="flex-1" />
        </div>
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
    </DialogBase>
  )
})

export const openBuildDialog = (indexBuilder: PZIndexBuilder) => {
  return openModal(<ToBuildDialog indexBuilder={indexBuilder} />)
}
