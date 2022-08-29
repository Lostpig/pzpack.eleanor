import React, { useMemo } from 'react'
import { usePZInstance, WhitePage, ErrorPage } from './modules/common'
import { PZFileExplorer } from './modules/pzpk-explorer'
import { PZPackBuilder } from './modules/pzpk-builder'

export const RoutesContainer = () => {
  const instance = usePZInstance()
  const content = useMemo(() => {
    if (!instance) return <WhitePage />
    if (instance.type === 'explorer') return <PZFileExplorer hash={instance.hash} port={instance.port} status={instance.status} />
    if (instance.type === 'builder') return <PZPackBuilder builder={instance.binding} />

    return <ErrorPage />
  }, [instance])

  return <div className="flex-1 overflow-hidden">{content}</div>
}
