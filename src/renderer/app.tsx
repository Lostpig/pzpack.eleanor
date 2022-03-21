import React from 'react'
import { TitleBar, Modal } from './modules/common'
import { RoutesContainer } from './routes'

export const App = () => {
  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50 dark:bg-neutral-800">
      <TitleBar />
      <RoutesContainer />
      <Modal />
    </div>
  )
}
