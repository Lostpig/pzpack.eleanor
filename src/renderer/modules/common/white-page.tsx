import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PZButton } from '../shared'
import { useModalManager, useIoService } from './hooks'
import { OpenFileDialog } from './dialogs'

export const WhitePage: React.FC = () => {
  const [t] = useTranslation()
  const { openModal } = useModalManager()
  const { openFile } = useIoService()

  const openHandler = useCallback(async () => {
    const file = await openFile()
    if (file) {
      openModal(<OpenFileDialog path={file} />)
    }
  }, [openFile, openModal])

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-black dark:text-gray-50">
      <div className="text-6xl mb-5">{t('have no opened file')}</div>
      <div>
        <span>{t('to open a file')}</span>
        <PZButton onClick={openHandler}>{t('open')}</PZButton>
        <span>{t('or create a new pack')}</span>
        <PZButton>{t('create')}</PZButton>
      </div>
    </div>
  )
}