import React from 'react'
import ReactDOM from 'react-dom'
import { initializeService } from './service/initialize'
import { App } from './app'

const startApp = () => {
  initializeService().then(() => {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      document.getElementById('app'),
    )
  })
}
startApp()
