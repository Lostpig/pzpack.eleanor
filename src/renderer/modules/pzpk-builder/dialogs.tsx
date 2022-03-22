import React, { useState, useContext, useRef, useEffect, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PZIndexBuilder, PZTask, BuildProgress } from 'pzpack'
import { formatSize, mergeCls, formatTime } from '../../utils'
import { useModalManager, ModalContext, DialogBase, useIoService, useInfoDialog } from '../common'
import { PZText, PZButton, PZPassword, PZProgress } from '../shared'
import { useBuilder } from './hooks'

export type SetNameDialogProps = {
  caption?: string
  orgName?: string
}
const SetNameDialog = (props: SetNameDialogProps) => {
  const [t] = useTranslation()
  const [msg, setMsg] = useState('')
  const { closeModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  const closeHandler = useCallback(
    (ok: boolean) => {
      const folderName = inputRef.current?.value.trim() ?? ''
      if (ok && (!folderName || folderName.length === 0)) return setMsg(t('name cannot be empty'))

      closeModal(id, folderName)
    },
    [id, setMsg, inputRef.current],
  )

  return (
    <DialogBase>
      <div className="flex flex-col">
        <div className="mt-1 mb-3">
          <label className="w-16 mr-6 text-right font-bold">{props.caption ?? t('set name')}</label>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <PZText ref={inputRef} className="flex-1" value={props.orgName ?? ''} onEnter={() => closeHandler(true)} />
        </div>
        <div className={mergeCls('mb-4 text-right', msg ? 'block' : 'hidden')}>
          <span className="text-red-600">{msg}</span>
        </div>
        <div className="flex flex-row justify-end">
          <PZButton type="primary" onClick={() => closeHandler(true)}>
            {t('ok')}
          </PZButton>
          <PZButton onClick={() => closeHandler(false)}>{t('cancel')}</PZButton>
        </div>
      </div>
    </DialogBase>
  )
}

type BuildingDialogProps = {
  start: number
  task: PZTask.AsyncTask<BuildProgress>
}
const BuildingDialog = (props: BuildingDialogProps) => {
  const { task } = props
  const [t] = useTranslation()
  const [usedTime, setUsedTime] = useState(formatTime(0))
  const { closeModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const [progress, setProgress] = useState<BuildProgress>()
  const info = useInfoDialog()
  const completeHandle = useCallback(
    (cop: PZTask.TaskCompleteReport<BuildProgress>) => {
      closeModal(id)

      if (cop.isCanceled) {
        info(t('building canceled'))
      } else if (cop.value) {
        const p = cop.value
        const time = (Date.now() - props.start) / 1000
        const total = formatSize(p.total[1])
        const speed = formatSize(p.total[1] / time)
        const message = t('build complete message ##', { time: formatTime(time), speed, total })
        info(message, t('build complete'))
      } else {
        info(t('build complete'))
      }
    },
    [info, closeModal, id],
  )
  useEffect(() => {
    const reporter = (p: BuildProgress) => {
      setProgress(p)
      const second = (Date.now() - props.start) / 1000
      setUsedTime(formatTime(second))
    }
    let completeBind = completeHandle
    task.addReporter(reporter)
    task.complete.then((p) => {
      completeBind(p)
    })

    return () => {
      task.removeReporter(reporter)
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
        <div className="flex mb-1 items-center">
          <label className="w-32 mr-6">{t('file')}</label>
          <span>
            {progress?.count[0]} / {progress?.count[1]}
          </span>
        </div>
        <div className="mb-1">
          <label>{t('current progress')}</label>
        </div>
        <div className="mb-1">
          <PZProgress value={progress?.current[0] ?? 0} total={progress?.current[1] ?? 0} />
        </div>
        <div className="mb-1">
          <label>{t('total progress')}</label>
        </div>
        <div className="mb-3">
          <PZProgress value={progress?.total[0] ?? 0} total={progress?.total[1] ?? 0} />
        </div>
        <div className="flex flex-row justify-end">
          <PZButton onClick={() => task.cancel()}>{t('cancel')}</PZButton>
        </div>
      </div>
    </DialogBase>
  )
}

type ToBuildDialogProps = {
  indexBuilder: PZIndexBuilder
}
const ToBuildDialog = memo((props: ToBuildDialogProps) => {
  const [t] = useTranslation()
  const [target, setTarget] = useState('')
  const [msg, setMsg] = useState('')
  const { closeModal, openModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const { saveFile } = useIoService()
  const descRef = useRef<HTMLInputElement>(null)
  const pwRef = useRef<HTMLInputElement>(null)
  const { startPZBuild } = useBuilder()

  useEffect(() => {
    descRef.current?.focus()
  }, [])
  const saveTarget = useCallback(() => {
    saveFile().then((f) => {
      if (f) setTarget(f)
    })
  }, [saveFile])
  const pwFocus = useCallback(() => pwRef.current?.focus(), [pwRef.current])
  const startBuild = useCallback(() => {
    const pw = pwRef.current?.value
    const desc = descRef.current?.value ?? ''
    if (!pw) return setMsg(t('password cannot be empty'))
    if (!target) return setMsg(t('save target cannot be empty'))

    const task = startPZBuild(props.indexBuilder, target, desc, pw)
    openModal(<BuildingDialog task={task} start={Date.now()} />)

    closeModal(id)
  }, [startPZBuild, target, descRef.current, pwRef.current])

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
          <label className="w-32 mr-6 text-right font-bold">{t('description')}</label>
          <PZText ref={descRef} className="flex-1" onEnter={() => pwFocus()} />
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

export const useBuilderDialogs = () => {
  const { openModal } = useModalManager()

  const openSetNameDialog = useCallback(
    (orgName?: string, caption?: string) => openModal(<SetNameDialog orgName={orgName} caption={caption} />),
    [openModal],
  )
  const openBuildDialog = useCallback(
    (indexBuilder: PZIndexBuilder) => openModal(<ToBuildDialog indexBuilder={indexBuilder} />),
    [openModal],
  )

  return {
    openSetNameDialog,
    openBuildDialog,
  }
}
