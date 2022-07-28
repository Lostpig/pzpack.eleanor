import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { PZSubscription } from 'pzpack'
import { mergeCls } from 'renderer/utils'
import { ModalContext } from './modal'
import { InfoIcon } from '../icons'
import { PZButton, PZText } from '../shared'
import { openModal, closeModal } from '../../service/modal'

export const DialogBase: React.FC = (props) => {
  return (
    <>
      <div className="bg-neutral-900/20 dark:bg-slate-600/70 absolute top-0 left-0 w-full h-full z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="overflow-hidden bg-white text-black rounded-md shadow-md dark:bg-neutral-700 dark:text-gray-50">
          <div style={{ minWidth: '400px', maxHeight: '75vh' }} className="w-full h-full p-4 auto-scrollbar">
            {props.children}
          </div>
        </div>
      </div>
    </>
  )
}

type InfoDialogProps = {
  caption?: string
  text: string
  type?: 'info' | 'error' | 'warning'
}
const InfoDialog = (props: InfoDialogProps) => {
  const [t] = useTranslation()
  const { id } = useContext(ModalContext)
  const iconColor =
    props.type === 'error' ? 'text-red-600' : props.type === 'warning' ? 'text-yellow-500' : 'text-blue-600'
  const textParts = props.text.split('\n').filter((s) => s.trim() !== '')

  return (
    <DialogBase>
      <div className="flex flex-col" style={{ width: '450px' }}>
        <div className="mt-1 mb-3">
          <span>{props.caption ?? ''}</span>
        </div>
        <div className="mb-4 flex items-center">
          <div className={mergeCls('w-8 mx-4', iconColor)}>
            <InfoIcon size={32} />
          </div>
          <div>
            {textParts.map((s, i) => (
              <p key={i} className="m-0">
                {s}
              </p>
            ))}
          </div>
        </div>
        <div className="flex flex-row justify-end">
          <PZButton type="primary" onClick={() => closeModal(id)}>
            {t('ok')}
          </PZButton>
        </div>
      </div>
    </DialogBase>
  )
}

type ConfirmDialogProps = {
  caption?: string
  text: string
}
const ConfirmDialog = (props: ConfirmDialogProps) => {
  const [t] = useTranslation()
  const { id } = useContext(ModalContext)

  return (
    <DialogBase>
      <div className="flex flex-col" style={{ width: '450px' }}>
        <div className="mt-1 mb-3">
          <span>{props.caption ?? ''}</span>
        </div>
        <div className="mb-4">
          <span>{props.text}</span>
        </div>
        <div className="flex flex-row justify-end">
          <PZButton type="primary" onClick={() => closeModal(id, 'ok')}>
            {t('ok')}
          </PZButton>
          <PZButton type="normal" onClick={() => closeModal(id)}>
            {t('cancel')}
          </PZButton>
        </div>
      </div>
    </DialogBase>
  )
}

export type SetNameDialogProps = {
  caption?: string
  orgName?: string
}
const SetNameDialog = (props: SetNameDialogProps) => {
  const [t] = useTranslation()
  const [msg, setMsg] = useState('')
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

export const openSetNameDialog = (orgName?: string, caption?: string) => {
  return openModal(<SetNameDialog orgName={orgName} caption={caption} />)
}
export const openInfoDialog = (text: string, caption?: string, type?: InfoDialogProps['type']) => {
  return openModal(<InfoDialog text={text} caption={caption} type={type} />)
}
export const openConfirmDialog = (text: string, caption?: string) => {
  return openModal(<ConfirmDialog text={text} caption={caption} />) as PZSubscription.PZObservable<'ok' | undefined>
}

