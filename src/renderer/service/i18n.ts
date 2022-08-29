import { createInstance, type InitOptions, type ResourceKey } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import { getConfig } from './config'
import { invokeIpc } from './ipc'

const instance = createInstance()

export const t = instance.t.bind(instance)
export const initI18n = async () => {
  const language = await getConfig('language')

  const options: InitOptions = {
    lng: language ?? 'zh-hans',
    fallbackLng: false,
    ns: 'common',
    defaultNS: 'common',
    load: 'currentOnly',
  }

  await instance
    .use(initReactI18next)
    .use(
      resourcesToBackend(async (lang, ns, cb) => {
        try {
          const json = await invokeIpc('load:text', `assets/i18n/${lang}/${ns}.json`)
          const res = JSON.parse(json) as ResourceKey

          cb(null, res)
        } catch (err: unknown) {
          cb(err as Error, null)
        }
      }),
    )
    .init(options)
}
