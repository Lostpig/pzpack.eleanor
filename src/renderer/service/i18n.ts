import * as path from 'path'
import { createInstance, type InitOptions, type ResourceKey } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import { invokeIpc } from './ipc'
import { getConfig } from './config'
import { readJsonAsync } from '../../lib/io'
import { RendererLogger } from './logger'

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
          const resource = await invokeIpc('req:resource', undefined)
          const filePath = path.join(resource, `assets/i18n/${lang}/${ns}.json`)
          const res = await readJsonAsync<ResourceKey>(filePath)
          cb(null, res)
        } catch (err: unknown) {
          RendererLogger.error('load i18n file failed:', lang, ns)
          cb(err as Error, null)
        }
      }),
    )
    .init(options)

  RendererLogger.debug('i18n service inited')
}
