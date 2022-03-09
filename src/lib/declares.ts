export interface ConfigSet {
  bosskey?: string
  fullscreen?: boolean
  language?: string
  maximizi?: boolean
  theme?: 'dark' | 'light' | 'system'
}
export type ConfigKey = keyof ConfigSet
export type ConfigValue<K extends ConfigKey> = ConfigSet[K]

export interface PackageInfo {
  name: string
  version: string
}
