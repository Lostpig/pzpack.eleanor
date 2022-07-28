import React from 'react'
import { useTranslation } from 'react-i18next'
import { PZButton } from '../shared'
import { openOpenFileDialog } from './open-dialog'

export const WhitePage: React.FC = () => {
  const [t] = useTranslation()
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-black dark:text-gray-50">
      <div className="text-6xl mb-5">{t('have no opened file')}</div>
      <div>
        <span>{t('to open a file')}</span>
        <PZButton onClick={openOpenFileDialog}>{t('open')}</PZButton>
      </div>
    </div>
  )
}