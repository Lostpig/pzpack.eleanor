import React, { useMemo } from 'react'
import { usePZInstance, WhitePage, ErrorPage } from './modules/common'
import { PZFileExplorer } from './modules/pzpk-explorer'
import { PZVideoExplorer } from './modules/pzmv-explorer'
import { PZPackBuilder } from './modules/pzpk-builder'
import { PZMVBuilder } from './modules/pzmv-builder'

export const RoutesContainer = () => {
  const instance = usePZInstance()
  const content = useMemo(() => {
    if (!instance) return <WhitePage />
    if (instance.type === 'loader')
      return <PZFileExplorer indices={instance.binding} port={instance.port} status={instance.status} />
    if (instance.type === 'mvloader')
      return <PZVideoExplorer indices={instance.binding} port={instance.port} status={instance.status} />
    if (instance.type === 'builder') return <PZPackBuilder builder={instance.binding} />
    if (instance.type === 'mvbuilder') return <PZMVBuilder builder={instance.binding} />

    return <ErrorPage />
  }, [instance?.type, instance?.binding])

  return <div className="flex-1 overflow-hidden">{content}</div>
}
