import { subscribeChannel, invokeIpc } from './ipc'

const reloadCss = () => {
  const cssLink = document.getElementById('index-css') as HTMLLinkElement
  const parts = cssLink.href.split('?')

  cssLink.href = parts[0] + '?seed=' + Date.now()
}

export const initDevMode = async () => {
  const isDev = await invokeIpc('req:dev', undefined)
  if (isDev) {
    subscribeChannel('dev::cssreload', reloadCss)
  }
}
