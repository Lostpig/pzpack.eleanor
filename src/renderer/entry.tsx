import React from 'react'
import ReactDOM from 'react-dom'
import { initializeService } from './service/initialize'
import { LoadingPage } from './modules/common'
import { App } from './app'

const startApp = () => {
  const AppEnter = React.lazy(() => {
    return initializeService().then(() => {
      return { default: App }
    })
  })

  ReactDOM.render(
    <React.StrictMode>
      <React.Suspense fallback={<LoadingPage />}>
        <AppEnter />
      </React.Suspense>
    </React.StrictMode>,
    document.getElementById('app'),
  )
}

startApp()
