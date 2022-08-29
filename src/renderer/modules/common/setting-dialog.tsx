import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PZButton, PZText } from '../shared'
import { ModalContext } from './modal'
import { DialogBase, openInfoDialog } from './dialogs'
import { openModal, closeModal } from '../../service/modal'
import { openFile } from '../../service/io'
import { getConfig, setConfig, checkExternalPlayer } from '../../service/config'
import { errorMessage } from 'renderer/utils'

const SettingDialog: React.FC = () => {
  const [t] = useTranslation()
  const { id } = useContext(ModalContext)
  const [externalPlayer, setExternalPlayer] = useState('')

  useEffect(() => {
    getConfig('externalPlayer').then((s) => setExternalPlayer(s ?? ''))
  }, [])
  const save = useCallback(() => {
    if (externalPlayer && !checkExternalPlayer(externalPlayer)) {
      openInfoDialog(t('external player path not right'), t('warning'), 'warning')
      return
    }

    Promise.all([
      setConfig('externalPlayer', externalPlayer),
    ])
      .then(() => {
        closeModal(id)
      })
      .catch((err) => {
        openInfoDialog(errorMessage(err, t), t('error'), 'error')
      })
  }, [externalPlayer])
  const selectExternalPlayer = useCallback(() => {
    openFile([{ name: 'EXE', extensions: ['exe'] }]).then((d) => {
      if (d) setExternalPlayer(d)
    })
  }, [setExternalPlayer])

  return (
    <DialogBase>
      <div className="flex flex-col" style={{ width: '750px' }}>
        <div className="mt-1 mb-3">
          <label className="text-xl font-bold">{t('setting')}</label>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <span className="w-32 mr-6 text-right">{t('external player')}</span>
          <PZButton type="normal" onClick={selectExternalPlayer}>
            {t('select')}
          </PZButton>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <span className="w-32 mr-6 text-right"></span>
          <PZText readonly className="flex-1" binding={externalPlayer} />
        </div>
        <div className="flex flex-row justify-end">
          <PZButton type="primary" onClick={() => save()}>
            {t('save')}
          </PZButton>
          <PZButton onClick={() => closeModal(id)}>{t('cancel')}</PZButton>
        </div>
      </div>
    </DialogBase>
  )
}

export const openSettingDialog = () => {
  return openModal(<SettingDialog />)
}
