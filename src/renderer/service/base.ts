import { PZLoader, PZSubscription } from 'pzpack'
import { PZLoaderObservable } from './pzpack'

export interface ContentState {
  content: 'empty' | 'explorer' | 'view' | 'edit'
}
export interface ExplorerContent {
  content: 'explorer'
  loader: PZLoader
}

export const AppContentNotify = new PZSubscription.PZNotify<ContentState>()
export const AppContentObservable = AppContentNotify.asObservable()

PZLoaderObservable.subscribe((loader) => {
  if (loader) {
    AppContentNotify.next({ content: 'explorer', loader } as ExplorerContent)
  } else {
    AppContentNotify.next({ content: 'empty' })
  }
})
