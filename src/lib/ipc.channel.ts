import type { PZSubscription } from 'pzpack'
import type {
  ConfigKey,
  ConfigValue,
  PackageInfo,
  Theme,
  AppliactionInfo,
  PZPKOpenResult,
  PZPKIndexResult,
  PZPKTaskResult,
  PZOpenArgs,
  PZExtractArgs,
  PZIndexArgs,
  PZBuildArgs,
  PWBookArgs,
  PWBookResult,
  PZPKBaseResult,
} from './declares'

export interface MainChannels {
  'window:operate': 'close' | 'maximize' | 'minimize' | 'hidden' | 'visibility'
  'exec:explayer': { url: string }
}

interface IPCTaskDataBase {
  id: string
  status: 'next' | 'error' | 'complete'
}
interface IPCTaskDataNext <T> extends IPCTaskDataBase {
  status: 'next'
  data: T
}
interface IPCTaskDataError extends IPCTaskDataBase {
  status: 'error'
  error: {
    errorCode?: string
    param?: Record<string, string | number>
    message: string
  }
}
interface IPCTaskDataComplete <R> extends IPCTaskDataBase {
  status: 'complete'
  canceled: boolean
  data: R
}
type IPCTaskData<T, R> = IPCTaskDataNext<T> | IPCTaskDataError | IPCTaskDataComplete <R>

export interface RendererChannels {
  'window:changed': 'resize' | 'maximize' | 'unmaximize' | 'minimize' | 'restore'
  'theme:changed': Theme
  'dev:reloadcss': void
  'pzpk:task': IPCTaskData<unknown, unknown>
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
  'application:clearcache': [void, void]

  'explayer:check': [string, boolean]
  'load:text': [string, string]

  'operate:openfile': [Electron.FileFilter[] | void, string]
  'operate:openfilemulti': [Electron.FileFilter[] | void, string[]]
  'operate:savefile': [Electron.FileFilter[] | void, string]
  'operate:openfolder': [void, string]
  'operate:scanfolder': [void, { folder: string, files: string[] }]

  'pzpk:open': [PZOpenArgs, PZPKOpenResult]
  'pzpk:getIndex': [PZIndexArgs, PZPKIndexResult]
  'pzpk:close': [string, void]
  'pzpk:build': [PZBuildArgs, PZPKTaskResult]
  'pzpk:extract': [PZExtractArgs, PZPKTaskResult]
  'pzpk:canceltask': [string, void]

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
