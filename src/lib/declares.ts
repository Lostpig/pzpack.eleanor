export type Theme = 'dark' | 'light' | 'system'
export interface ConfigSet {
  bosskey?: string
  fullscreen?: boolean
  language?: string
  maximizi?: boolean
  theme?: Theme
}
export type ConfigKey = keyof ConfigSet
export type ConfigValue<K extends ConfigKey> = ConfigSet[K]

export interface PackageInfo {
  name: string
  version: string
}
