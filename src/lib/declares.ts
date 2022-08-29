import type { PZFilePacked, PZFolder, PZBuildOptions } from 'pzpack'

export type Theme = 'dark' | 'light' | 'system'
export interface ConfigSet {
  bosskey?: string
  fullscreen?: boolean
  language?: string
  maximizi?: boolean
  theme?: Theme
  externalPlayer?: string
}
export type ConfigKey = keyof ConfigSet
export type ConfigValue<K extends ConfigKey> = ConfigSet[K]

export interface PackageInfo {
  name: string
  version: string
}
export interface AppliactionInfo {
  DEBUG: boolean
  ROOT: string
  RESOURCE: string
}
export interface PZLoaderStatus {
  filename: string
  version: number
  size: number
}

export type PZPKOpenSuccess = {
  success: true
  hash: string
  port: number
  loaderStatus: PZLoaderStatus
}
export type PZPKIndexSuccess = {
  success: true
  data: {
    files: PZFilePacked[],
    folders: PZFolder[]
  }
}
export type PZPKTaskSuccess = {
  success: true
  taskId: string
  initState: unknown
}
export type PZPKFailedResult = {
  success: false
  error: {
    errorCode?: string
    param?: Record<string, string | number>
    message: string
  }
}
export type PZPKSuccessResult = {
  success: true
}
export type PZPKBaseResult = PZPKSuccessResult | PZPKFailedResult
export type PZPKOpenResult = PZPKOpenSuccess | PZPKFailedResult
export type PZPKIndexResult = PZPKIndexSuccess | PZPKFailedResult
export type PZPKTaskResult = PZPKTaskSuccess | PZPKFailedResult

export type PZOpenArgs = {
  path: string
  password: string
}
export type PZIndexArgs = {
  hash: string
  path: string
}
export type PZBuildArgs = {
  indexData: string
  options: PZBuildOptions
}
export type PZExtractArgs = {
  hash: string
  type: 'all' | 'folder' | 'file'
  source: string
  target: string
}

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
