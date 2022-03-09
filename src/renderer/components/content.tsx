import React, { useEffect, useState } from 'react'
import { AppContentObservable, ContentState, ExplorerContent } from '../service/base'
import { WhitePageContent } from './whitepage'
import { PZFileExplorer } from './explorer'

const useContent = () => {
  const [content, setContent] = useState<ContentState>({ content: 'empty' })
  useEffect(() => {
    const subscription = AppContentObservable.subscribe(setContent)
    return () => subscription.unsubscribe()
  }, [])

  return content
}
const renderContent = (state: ContentState) => {
  switch (state.content) {
    case 'explorer':
      return <PZFileExplorer loader={(state as ExplorerContent).loader} />
    default:
      return <WhitePageContent />
  }
}

export const AppContent: React.FC = () => {
  const content = useContent()
  return <div className="flex-1 overflow-hidden">{renderContent(content)}</div>
}
