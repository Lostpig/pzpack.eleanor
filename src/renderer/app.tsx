import React from 'react'
import { TitleBar } from './components/titlebar'
import { AppContent } from './components/content'
import { Modal } from './components/modal'

export const App = () => {
  return (
    <div className='flex flex-col w-screen h-screen bg-gray-50 dark:bg-neutral-800'>
      <TitleBar />
      <AppContent />
      <Modal />
    </div>
  )
}
