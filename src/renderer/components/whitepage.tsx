import React from 'react'
import { useTranslation } from 'react-i18next'
import { PZButton } from './common'
import { openFile } from '../service/modal'

export const WhitePageContent: React.FC = () => {
  const [t] = useTranslation()

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-black dark:text-gray-50">
      <div className="text-6xl mb-5">{t('have no opened file')}</div>
      <div>
        <span>{t('to open a file')}</span>
        <PZButton onClick={openFile}>{t('open')}</PZButton>
        <span>{t('or create a new pack')}</span>
        <PZButton>{t('create')}</PZButton>
      </div>
    </div>
  )
}
