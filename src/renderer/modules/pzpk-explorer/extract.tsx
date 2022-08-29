import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ExtractProgress, PZTask } from 'pzpack'

import { formatTime, formatFileSize, errorMessage } from '../../utils'
import { ModalContext, DialogBase, info } from '../common'
import { PZButton, PZProgress } from '../shared'
import { openModal, closeModal } from '../../service/modal'

type ExtractDialogProps = {
  start: number
  task: PZTask.AsyncTask<ExtractProgress>
}
const ExtractDialog: React.FC<ExtractDialogProps> = ({ start, task }) => {
  const [t] = useTranslation()
  const [usedTime, setUsedTime] = useState(formatTime(0))
  const { id } = useContext(ModalContext)
  const [progress, setProgress] = useState<ExtractProgress>()
  const taskObs = useMemo(() => task.observable(), [task])

  const completeHandle = useCallback(
    (taskState: { canceled: boolean; error?: Error }) => {
      closeModal(id)

      if (taskState.error) {
        info(errorMessage(taskState.error, t), t('error'), 'error')
      }
      if (taskState.canceled) {
        info(t('extract canceled'))
      } else {
        const time = (Date.now() - start) / 1000
        const bytes = formatFileSize(taskObs.current.extractSize)
        const speed = formatFileSize(taskObs.current.extractSize / time)

        const message = t('extract complete message ##', { time: formatTime(time), bytes, speed })
        info(message, t('extract complete'))
      }
    },
    [info, id, taskObs],
  )
  useEffect(() => {
    const subscription = taskObs.subscribe(
      (p: ExtractProgress) => {
        setProgress(p)
        const second = (Date.now() - start) / 1000
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
          <label className="font-bold">{t('extracting')}</label>
        </div>
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('used time')}</label>
          <span>{usedTime}</span>
        </div>
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('file')}</label>
          <span>
            {progress?.extractCount} / {progress?.totalCount}
          </span>
        </div>
        <div className="mb-1">
          <label>{t('current progress')}</label>
        </div>
        <div className="mb-1">
          <PZProgress value={progress?.current ?? 0} total={progress?.currentSize ?? 0} />
        </div>
        <div className="mb-1">
          <label>{t('total progress')}</label>
        </div>
        <div className="mb-3">
          <PZProgress value={progress?.extractSize ?? 0} total={progress?.totalSize ?? 0} />
        </div>
        <div className="flex flex-row justify-end">
          <PZButton onClick={() => task.cancel()}>{t('cancel')}</PZButton>
        </div>
      </div>
    </DialogBase>
  )
}
export const openExtractDialog = (task: PZTask.AsyncTask<ExtractProgress>) => {
  const start = Date.now()
  return openModal(<ExtractDialog start={start} task={task} />)
}

