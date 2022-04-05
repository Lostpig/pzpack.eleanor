import type { PZTypes, PZVideo } from 'pzpack'

export type Theme = 'dark' | 'light' | 'system'
export interface ConfigSet {
  bosskey?: string
  fullscreen?: boolean
  language?: string
  maximizi?: boolean
  theme?: Theme

  ffmpeg?: string
  tempDir?: string
  externalPlayer?: string
}
export type ConfigKey = keyof ConfigSet
export type ConfigValue<K extends ConfigKey> = ConfigSet[K]

export interface PackageInfo {
  name: string
  version: string
}
export interface AppliactionInfo {
  DEV: boolean
  DEBUG: boolean
  ROOT: string
  RESOURCE: string
}
export interface PZLoaderStatus {
  filename: string
  type: PZTypes
  version: number
  description: string
  size: number
}

type PZPKOpenSuccess = {
  success: true
  id: number
  port: number
  loaderStatus: PZLoaderStatus
}
type PZPKIndexSuccess = {
  success: true
  data: Buffer
}
type PZPKPackSuccess = {
  success: true
  id: number
}
type PZPKFailedResult = {
  success: false
  message: string
}
type PZPKSuccessResult = {
  success: true
}
export type PZPKBaseResult = PZPKSuccessResult | PZPKFailedResult
export type PZPKOpenResult = PZPKOpenSuccess | PZPKFailedResult
export type PZPKIndexResult = PZPKIndexSuccess | PZPKFailedResult
export type PZPKPackResult = PZPKPackSuccess | PZPKFailedResult

export type PZBuildOptions = {
  desc: string
  password: string
  target: string
}
export type PZMVBuildOptions = Omit<PZVideo.PZMVBuilderOptions, 'ffmpegDir' | 'tempDir' | 'indexBuilder'>
export interface PZPKBuildArgs {
  type: 'PZPACK'
  indexData: string
  options: PZBuildOptions
}
export interface PZPKMvBuildArgs {
  type: 'PZVIDEO'
  indexData: string
  target: string
  options: PZMVBuildOptions
}
export type PZPKPackArgs = PZPKBuildArgs | PZPKMvBuildArgs

export type PWBookArgs = {
  mode: 'open' | 'create'
  filename: string
  masterPw: string
}
export type PWBookSuccess = {
  success: true
  filename: string
  items: string[]
}
export type PWBookResult = PWBookSuccess | PZPKFailedResult
