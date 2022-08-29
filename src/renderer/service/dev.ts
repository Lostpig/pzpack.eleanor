import { subscribeChannel } from './ipc'

const reloadCss = () => {
  const cssLink = document.getElementById('index-css') as HTMLLinkElement
  const parts = cssLink.href.split('?')

  cssLink.href = parts[0] + '?seed=' + Date.now()
}
export const initDevMode = async () => {
  if (ENV_DEV) {
    subscribeChannel('dev:reloadcss', reloadCss)
  }
}
