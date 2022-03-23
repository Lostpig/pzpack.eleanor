import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PZButton, PZText } from '../shared'
import { useModalManager, useConfig, useIoService } from './hooks'
import { ModalContext } from './modal'
import { DialogBase, useInfoDialog } from './dialogs'

const SettingDialog: React.FC = () => {
  const [t] = useTranslation()
  const { closeModal } = useModalManager()
  const { id } = useContext(ModalContext)
  const { getConfig, setConfig, checkFfmpeg, checkExternalPalyer } = useConfig()
  const { openDir, openFile } = useIoService()
  const info = useInfoDialog()
  const [ffmpegPath, setFfmpegPath] = useState('')
  const [tempPath, setTempPath] = useState('')
  const [externalPlayer, setExternalPlayer] = useState('')

  useEffect(() => {
    getConfig('ffmpeg').then((s) => setFfmpegPath(s ?? ''))
    getConfig('tempDir').then((s) => setTempPath(s ?? ''))
    getConfig('externalPlayer').then((s) => setExternalPlayer(s ?? ''))
  }, [])
  const save = useCallback(() => {
    if (!checkFfmpeg(ffmpegPath)) {
      info(t('ffmpeg path not right'), t('warning'), 'warning')
      return
    }
    if (externalPlayer && !checkExternalPalyer(externalPlayer)) {
      info(t('external player path not right'), t('warning'), 'warning')
      return
    }

    Promise.all([
      setConfig('ffmpeg', ffmpegPath),
      setConfig('tempDir', tempPath),
      setConfig('externalPlayer', externalPlayer),
    ])
      .then(() => {
        closeModal(id)
      })
      .catch((err) => {
        info(err?.message ?? t('unknown error'), t('error'), 'error')
      })
  }, [setConfig, ffmpegPath, tempPath, externalPlayer])
  const selectFfmpeg = useCallback(() => {
    openDir().then((d) => {
      if (d) setFfmpegPath(d)
    })
  }, [openDir, setFfmpegPath])
  const selectTempPath = useCallback(() => {
    openDir().then((d) => {
      if (d) setTempPath(d)
    })
  }, [openDir, setTempPath])
  const selectExternalPlayer = useCallback(() => {
    openFile([{ name: 'EXE', extensions: ['exe'] }]).then((d) => {
      if (d) setExternalPlayer(d)
    })
  }, [openFile, setExternalPlayer])

  return (
    <DialogBase>
      <div className="flex flex-col" style={{ width: '750px' }}>
        <div className="mt-1 mb-3">
          <label className="text-xl font-bold">{t('setting')}</label>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <span className="w-32 mr-6 text-right">{t('ffmpeg path')}</span>
          <PZButton type="normal" onClick={selectFfmpeg}>
            {t('select')}
          </PZButton>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <span className="w-32 mr-6 text-right"></span>
          <PZText readonly className="flex-1" binding={ffmpegPath} />
        </div>
        <div className="mb-4 flex flex-row items-center">
          <span className="w-32 mr-6 text-right">{t('temp directory')}</span>
          <PZButton type="normal" onClick={selectTempPath}>
            {t('select')}
          </PZButton>
        </div>
        <div className="mb-4 flex flex-row items-center">
          <span className="w-32 mr-6 text-right"></span>
          <PZText readonly className="flex-1" binding={tempPath} />
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

export const useSettingDialog = () => {
  const { openModal } = useModalManager()
  const openHandler = useCallback(() => {
    return openModal(<SettingDialog />)
  }, [openModal])
  return openHandler
}
