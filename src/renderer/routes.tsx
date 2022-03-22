import React, { useMemo } from 'react'
import { usePZInstance, WhitePage } from './modules/common'
import { PZFileExplorer } from './modules/pzpk-explorer'
import { PZVideoExplorer } from './modules/pzmv-explorer'
import { PZPackBuilder } from './modules/pzpk-builder'

export const RoutesContainer = () => {
  const instance = usePZInstance()
  const content = useMemo(() => {
    if (!instance) return <WhitePage />
    if (instance.type === 'loader') return <PZFileExplorer loader={instance.binding} />
    if (instance.type === 'mvloader') return <PZVideoExplorer server={instance.binding} />
    if (instance.type === 'builder') return <PZPackBuilder builder={instance.binding} />

    return <span>${instance.type}</span>
  }, [instance?.type, instance?.binding])

  return <div className="flex-1 overflow-hidden">
    { content }
  </div>
}