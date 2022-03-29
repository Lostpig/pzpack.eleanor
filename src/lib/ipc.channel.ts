import type { PZTypes } from 'pzpack'
import type { ConfigKey, ConfigValue, PackageInfo, Theme } from './declares'

interface IPCChannelDeclareMap {
  'window::operate': 'close' | 'maximize' | 'minimize' | 'hidden' | 'visibility'
  'window::changed': 'resize' | 'maximize' | 'unmaximize' | 'minimize' | 'restore'
  'window::inited': { x: number; y: number; h: number; w: number; maximize: boolean; minimize: boolean }
  'renderer::ready': null
  'theme::set': Theme
  'theme::setted': Theme
  'exec::player': string
  'dev::cssreload': null
}

export type Channel = keyof IPCChannelDeclareMap
export type ChData<C extends Channel> = IPCChannelDeclareMap[C]
export type ChPayload<C extends Channel = Channel> = { channel: C; data: ChData<C> }
export type ChHandler<C extends Channel> = (data: ChData<C>) => void

interface IPCInvokeDeclareMap {
  'req:root': [undefined, string]
  'req:resource': [undefined, string]
  'req:config': [ConfigKey, ConfigValue<ConfigKey>]
  'req:package': [void, PackageInfo]
  'req:theme': [void, Theme]
  'set:config': [{ key: ConfigKey; value: ConfigValue<ConfigKey> }, void],
  'fd:open': [Electron.FileFilter[] | undefined, string]
  'fd:select': [Electron.FileFilter[] | undefined, string[]]
  'fd:save': [PZTypes, string]
  'fd:dir': [void, string]
  'req:dev': [void, boolean]
}
export type InvokeChannel = keyof IPCInvokeDeclareMap
export type InvokeArg<C extends InvokeChannel> = IPCInvokeDeclareMap[C][0]
export type InvokeRet<C extends InvokeChannel> = IPCInvokeDeclareMap[C][1]
export type InvokeHandler<C extends InvokeChannel> = (arg: InvokeArg<C>) => InvokeRet<C>
export type InvokeCaller<C extends InvokeChannel> = (channel: C, arg: InvokeArg<C>) => Promise<InvokeRet<C>>
