import type { PZSubscription, BuildProgress, PZVideo } from 'pzpack'
import type {
  ConfigKey,
  ConfigValue,
  PackageInfo,
  Theme,
  AppliactionInfo,
  PZPKOpenResult,
  PZPKIndexResult,
  PZPKPackResult,
  PZPKPackArgs,
  PWBookArgs,
  PWBookResult,
  PZPKBaseResult,
} from './declares'

export interface MainChannels {
  'window:operate': 'close' | 'maximize' | 'minimize' | 'hidden' | 'visibility'
  'theme:set': Theme
  'exec:explayer': { url: string }
}
export interface RendererChannels {
  'window:changed': 'resize' | 'maximize' | 'unmaximize' | 'minimize' | 'restore'
  'theme:changed': Theme
  'dev:reloadcss': void

  'pzpk:building': { hash: string; progress: BuildProgress }
  'pzpk:mvbuilding': { hash: string; progress: PZVideo.PZMVProgress }
  'pzpk:buildcomplete': { hash: string; canceled: boolean }

  'pwbook:update': { items: string[] }
}

export type MainChannelKeys = keyof MainChannels
export type MainChannelData<K extends MainChannelKeys> = MainChannels[K]
export type MainChannelHandler<K extends MainChannelKeys> = (data: MainChannelData<K>) => void
export type RendererChannelKeys = keyof RendererChannels
export type RendererChannelData<K extends RendererChannelKeys> = RendererChannels[K]
export type RendererChannelHandler<K extends RendererChannelKeys> = (data: RendererChannelData<K>) => void

export type MainChannelReceiver<C extends MainChannelKeys> = {
  subscribe: (handler: MainChannelHandler<C>) => PZSubscription.Subscription
}
export type MainChannelSender<C extends RendererChannelKeys> = {
  send: (data: RendererChannelData<C>) => void
}
export type RendererChannelReceiver<C extends RendererChannelKeys> = {
  subscribe: (handler: RendererChannelHandler<C>) => PZSubscription.Subscription
}
export type RendererChannelSender<C extends MainChannelKeys> = {
  send: (data: MainChannelData<C>) => void
}

interface IPCInvokes {
  'config:set': [{ key: ConfigKey; value: ConfigValue<ConfigKey> }, void]
  'config:get': [ConfigKey, ConfigValue<ConfigKey>]
  'theme:get': [void, Theme]
  'theme:set': [Theme, void]

  'application:inited': [void, { maximize: boolean; theme: Theme }]
  'application:getinfo': [void, AppliactionInfo]
  'application:getpkg': [void, PackageInfo]

  'operate:openfile': [Electron.FileFilter[] | void, string]
  'operate:openfilemulti': [Electron.FileFilter[] | void, string[]]
  'operate:savefile': [Electron.FileFilter[] | void, string]
  'operate:openfolder': [void, string]

  'pzpk:open': [{ filename: string; password: string }, PZPKOpenResult]
  'pzpk:close': [string, void]
  'pzpk:pack': [PZPKPackArgs, PZPKPackResult]
  'pzpk:getIndex': [string, PZPKIndexResult]

  'pwbook:close': [void, PZPKBaseResult]
  'pwbook:current': [void, PWBookResult]
  'pwbook:open': [PWBookArgs, PWBookResult]
  'pwbook:add': [string, PZPKBaseResult]
  'pwbook:delete': [string, PZPKBaseResult]
  'pwbook:tryopen': [string, PZPKOpenResult]
}
export type InvokeChannel = keyof IPCInvokes
export type InvokeArg<C extends InvokeChannel> = IPCInvokes[C][0]
export type InvokeRet<C extends InvokeChannel> = IPCInvokes[C][1]
export type InvokeHandler<C extends InvokeChannel> = (arg: InvokeArg<C>) => InvokeRet<C> | Promise<InvokeRet<C>>
export type InvokeCaller<C extends InvokeChannel> = (channel: C, arg: InvokeArg<C>) => Promise<InvokeRet<C>>
