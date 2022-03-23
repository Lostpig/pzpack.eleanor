import * as path from 'path'
import * as fs from 'fs'
import type { ConfigKey, ConfigValue } from '../../lib/declares'
import { invokeIpc } from './ipc'

export const getConfig = <K extends ConfigKey>(key: K) => {
  return invokeIpc('req:config', key) as Promise<ConfigValue<K>>
}
export const setConfig = <K extends ConfigKey>(key: K, value: ConfigValue<K>) => {
  return invokeIpc('set:config', { key, value })
}
export const checkFfmpeg = (dir: string) => {
  const binPath = path.join(dir, 'ffmpeg.exe')
  const ffprobePath = path.join(dir, 'ffprobe.exe')
  const binExists = fs.existsSync(binPath)
  const ffprobeExists = fs.existsSync(ffprobePath)

  return binExists && ffprobeExists
}
export const checkExternalPalyer = (filename: string) => {
  const ext = path.extname(filename)
  if (ext !== '.exe') return false

  const binExists = fs.existsSync(filename)
  return binExists
}