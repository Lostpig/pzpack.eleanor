import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { mergeCls } from 'renderer/utils'
import { ModalContext } from './modal'
import { useModalManager, usePZPackService } from './hooks'
import { PZButton, PZPassword, type PZPasswordRef } from '../shared'

const DialogBase: React.FC = (props) => {
  return (
    <>
      <div className="bg-neutral-900/20 dark:bg-slate-600/70 absolute top-0 left-0 w-full h-full z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="bg-white text-black p-4 rounded-md shadow-md dark:bg-neutral-700 dark:text-gray-50">
          {props.children}
        </div>
      </div>
    </>
  )
}

type FileDialogProps = {
  path: string
}
export const OpenFileDialog = (props: FileDialogProps) => {
  const [t] = useTranslation()
  const [msg, setMsg] = useState('')
  const { closeModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const { openPZloader } = usePZPackService()
  const pwElRef = useRef<PZPasswordRef>(null)

  useEffect(() => {
    pwElRef.current?.focus()
  }, [])
  const openHandler = useCallback(() => {
    const pw = pwElRef.current?.value ?? ''
    const result = openPZloader(props.path, pw)
    if (result.success) closeModal(id)
    else setMsg(result.message && result.message !== '' ? result.message : 'unknown error')
  }, [openPZloader, setMsg, pwElRef.current])

  return (
    <DialogBase>
      <div className="flex flex-col">
        <div className="my-4">
          <label className="w-16 mr-6 text-right font-bold">{t('file opening')}</label>
          <span>{props.path}</span>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <label className="w-16 mr-6 text-right font-bold">{t('password')}</label>
          <PZPassword ref={pwElRef} className="flex-1" onEnter={openHandler} />
        </div>
        <div className={mergeCls('mb-4 text-right', msg ? 'block' : 'hidden')}>
          <span className="text-red-600">{msg}</span>
        </div>
        <div className="flex flex-row justify-end">
          <PZButton type="primary" onClick={openHandler}>
            {t('ok')}
          </PZButton>
          <PZButton onClick={() => closeModal(id)}>{t('cancel')}</PZButton>
        </div>
      </div>
    </DialogBase>
  )
}
