import React, { PropsWithChildren, useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PZButton, PZPassword, PZPasswordRef } from './common'
import { closeModal } from '../service/modal'
import { openPZPackFile } from '../service/pzpack'
import { mergeCls } from 'renderer/utils'

const DialogBase = (props: PropsWithChildren<{}>) => {
  return (
    <div className="bg-white text-black p-4 rounded-md shadow-md dark:bg-neutral-700 dark:text-gray-50">
      {props.children}
    </div>
  )
}

type FileDialogProps = {
  path: string
}
export const OpenFileDialog = (props: FileDialogProps) => {
  const [t] = useTranslation()
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const pwElRef = useRef<PZPasswordRef>(null)

  const openHandler = () => {
    const result = openPZPackFile(props.path, pw)
    if (result.success) {
      closeModal()
    } else {
      setMsg(result.message && result.message !== '' ? result.message : 'unknown error')
    }
  }
  useEffect(() => {
    pwElRef.current?.focus()
  }, [])

  return (
    <DialogBase>
      <div className="flex flex-col">
        <div className="my-4">
          <label className="w-16 mr-6 text-right font-bold">{t('file opening')}</label>
          <span>{props.path}</span>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <label className="w-16 mr-6 text-right font-bold">{t('password')}</label>
          <PZPassword ref={pwElRef} className="flex-1" onChange={setPw} onEnter={openHandler} />
        </div>
        <div className={mergeCls('mb-4 text-right', msg ? 'block' : 'hidden')}>
          <span className="text-red-600">{msg}</span>
        </div>
        <div className="flex flex-row justify-end">
          <PZButton type="primary" onClick={openHandler}>
            {t('ok')}
          </PZButton>
          <PZButton onClick={() => closeModal()}>{t('cancel')}</PZButton>
        </div>
      </div>
    </DialogBase>
  )
}
