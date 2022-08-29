import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage, mergeCls } from '../../utils'
import { ModalContext } from './modal'
import { PZButton, PZPassword, type PZPasswordRef } from '../shared'
import { DialogBase } from './dialogs'
import { openModal, closeModal } from '../../service/modal'
import { openPZloader } from '../../service/pzpack'
import { openFile } from '../../service/io'
import { tryOpenFile } from '../../service/pwbook'

type FileDialogProps = {
  path: string
}
const OpenFileDialog = (props: FileDialogProps) => {
  const [t] = useTranslation()
  const [msg, setMsg] = useState('')
  const { id } = useContext(ModalContext)
  const pwElRef = useRef<PZPasswordRef>(null)

  useEffect(() => {
    pwElRef.current?.focus()
  }, [])
  const openHandler = useCallback(() => {
    const pw = pwElRef.current?.value ?? ''
    openPZloader(props.path, pw).then((result) => {
      if (result.success) closeModal(id)
      else setMsg(errorMessage(result.error, t))
    })
  }, [setMsg, pwElRef.current])

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

export const openOpenFileDialog = async () => {
  const file = await openFile()
  if (!file) return

  const tryResult = await tryOpenFile(file)
  if (tryResult.success) {
    return
  }

  openModal(<OpenFileDialog path={file} />)
}