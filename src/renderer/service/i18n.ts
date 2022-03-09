import * as fs from 'fs'
import * as path from 'path'
import { InitOptions, createInstance, type ResourceKey } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import { getConfig } from './config'
import { invokeIpc } from './ipc'
import { readJsonAsync } from '../../lib/io'
import { RendererLogger } from './logger'

const instance = createInstance()

export const t = instance.t.bind(instance)
export const initI18n = async () => {
  const language = await getConfig('language')
  const root = await invokeIpc('req:root', undefined)

  const options: InitOptions = {
    lng: language ?? 'zh-hans',
    fallbackLng: false,
    ns: 'common',
    defaultNS: 'common',
    load: 'currentOnly'
  }

  await instance
    .use(initReactI18next)
    .use(
      resourcesToBackend(async (lang, ns, cb) => {
        try {
          const filePath = path.join(root, 'assets/i18n', lang, `${ns}.json`)
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
