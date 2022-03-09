import React from 'react'
import { useTranslation } from 'react-i18next'

export const ErrorPage: React.FC<{ error: string }> = (props) => {
  const [t] = useTranslation()

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-red-600">
      <div className="text-xl mb-3">{t('error')}</div>
      <div className="text-xl mb-3">{props.error}</div>
    </div>
  )
}
