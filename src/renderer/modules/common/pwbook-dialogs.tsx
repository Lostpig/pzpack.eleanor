import React, { useState, useEffect, useRef, useContext, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { mergeCls, defFilters, randomPassword } from '../../utils'
import { ModalContext } from './modal'
import { useModalManager, useIoService, usePwBookService } from './hooks'
import { PZButton, PZPassword, type PZPasswordRef } from '../shared'
import { DialogBase } from './dialogs'

type PwBookDialogProps = {
  mode: 'open' | 'create'
  path: string
}
const OpenPwBookDialog = (props: PwBookDialogProps) => {
  const [t] = useTranslation()
  const [msg, setMsg] = useState('')
  const { closeModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const { openPasswordBook } = usePwBookService()
  const pwElRef = useRef<PZPasswordRef>(null)

  useEffect(() => {
    pwElRef.current?.focus()
  }, [])
  const openHandler = useCallback(() => {
    const pw = pwElRef.current?.value.trim() ?? ''
    if (!pw || pw.length === 0) return setMsg(t('password cannot be empty'))

    openPasswordBook(props.path, pw, props.mode).then((result) => {
      if (result.success) closeModal(id, result.filename)
      else setMsg(result.message && result.message !== '' ? result.message : 'unknown error')
    })
  }, [openPasswordBook, setMsg, pwElRef.current])

  return (
    <DialogBase>
      <div className="flex flex-col">
        <div className="my-4">
          <label className="w-16 mr-6 text-right font-bold">{t('file opening')}</label>
          <span>{props.path}</span>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <label className="w-16 mr-6 text-right font-bold">{t('master password')}</label>
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

const AddPassowrdDialog = () => {
  const [t] = useTranslation()
  const [msg, setMsg] = useState('')
  const { closeModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const { addPassword } = usePwBookService()
  const pwElRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    pwElRef.current?.focus()
  }, [])
  const closeHandler = useCallback(
    (ok: boolean) => {
      if (ok) {
        const pw = pwElRef.current?.value.trim() ?? ''
        if (!pw || pw.length === 0) return setMsg(t('password cannot be empty'))

        addPassword(pw).then((res) => {
          if (res.success) closeModal(id)
          else setMsg(res.message)
        })
      } else {
        closeModal(id)
      }
    },
    [id, setMsg, pwElRef.current],
  )
  const randomHandler = useCallback(() => {
    if (pwElRef.current) pwElRef.current.value = randomPassword()
  }, [pwElRef.current])

  return (
    <DialogBase>
      <div className="flex flex-col">
        <div className="mt-1 mb-3">
          <label className="text-xl font-bold">{t('add password')}</label>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <PZButton type="primary" onClick={randomHandler}>{t('random password')}</PZButton>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <PZPassword ref={pwElRef} className="flex-1" onEnter={() => closeHandler(true)} />
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

type PasswordItemProps = {
  hash: string
  onDelete?: () => void
}
const PasswordItem: React.FC<PasswordItemProps> = memo(({ hash, onDelete }) => {
  const [t] = useTranslation()
  const hashText = hash.slice(0, 4) + '********' + hash.slice(-4)

  return (
    <div className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600">
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{hashText}</div>
      <div className="text-right w-32 pr-4">
        <PZButton type="link" onClick={onDelete}>
          {t('delete')}
        </PZButton>
      </div>
    </div>
  )
})

type PwBookEditDialogProps = {
  items: string[]
}
const PwBookEditDialog: React.FC<PwBookEditDialogProps> = (props) => {
  const [t] = useTranslation()
  const { closeModal, openModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const [list, setList] = useState<string[]>(props.items)
  const { pwbookUpdater, deletePassword } = usePwBookService()
  const addHandler = () => {
    openModal(<AddPassowrdDialog />)
  }

  useEffect(() => {
    const subscription = pwbookUpdater.subscribe((items) => {
      setList(items)
    })

    return () => subscription.unsubscribe()
  }, [pwbookUpdater])

  return (
    <DialogBase>
      <div className="flex flex-col" style={{ height: '400px', width: '500px' }}>
        <div className="mt-1 mb-3">
          <label className="text-xl font-bold">{t('password book')}</label>
        </div>
        <div className="flex-1 auto-scrollbar border-slate-400 border mb-3">
          {list.map((f, i) => (
            <PasswordItem key={i} hash={f} onDelete={() => deletePassword(f)} />
          ))}
        </div>
        <div className="flex flex-row">
          <div>
            <PZButton type="primary" onClick={addHandler}>
              {t('add')}
            </PZButton>
          </div>
          <div className="flex-1 text-right">
            <PZButton onClick={() => closeModal(id)}>{t('close')}</PZButton>
          </div>
        </div>
      </div>
    </DialogBase>
  )
}

export const usePwBookDialog = () => {
  const { openModal } = useModalManager()
  const { openFile, saveFile } = useIoService()
  const { getCurrentPasswordBook } = usePwBookService()

  const openHandler = useCallback(
    async (mode: 'open' | 'create') => {
      let file
      if (mode === 'open') {
        file = await openFile([defFilters.PZPwBook])
      } else {
        file = await saveFile([defFilters.PZPwBook])
      }

      if (file) {
        return openModal(<OpenPwBookDialog path={file} mode={mode} />)
      } else {
        return undefined
      }
    },
    [openFile, saveFile, openModal],
  )
  const editHandler = useCallback(async () => {
    const current = await getCurrentPasswordBook()

    if (current.success) {
      openModal(<PwBookEditDialog items={current.items} />)
    }
  }, [getCurrentPasswordBook, openModal])

  return { open: openHandler, openEdit: editHandler }
}
