import * as path from 'path'
import * as fs from 'fs'
import { appLogger } from './logger'
import { ROOT } from './common'
import type { ConfigSet } from '../../lib/declares'
import { ensureFileDirAsync, readJson, writeJsonAsync, ensureFileDir, writeJson } from './io'
import { PZUtils } from 'pzpack'

const configPath = path.join(ROOT, 'data', 'config.json')
class ConfigManager {
  private inited = false
  private data: ConfigSet = {}

  private loadFile() {
    const exists = fs.existsSync(configPath)
    if (!exists) {
      appLogger.info('config file not exists')
      return
    }

    try {
      this.data = readJson(configPath)
    } catch (e) {
      appLogger.errorStack(e)
      this.data = {}
    } finally {
      this.inited = true
    }
  }
  private writingFlag = false
  private writeFile() {
    this.excuteWrite()
  }
  private async excuteWrite() {
    if (this.writingFlag) return

    this.writingFlag = true
    await PZUtils.wait(60000)
    if (this.writingFlag) {
      await ensureFileDirAsync(configPath)
      await writeJsonAsync(configPath, this.data)
      this.writingFlag = false
    }
  }

  get<K extends keyof ConfigSet>(key: K): ConfigSet[K] {
    if (!this.inited) this.loadFile()
    return this.data[key]
  }
  set<K extends keyof ConfigSet>(key: K, value: ConfigSet[K]): void {
    if (!this.inited) this.loadFile()

    if (this.data[key] !== value) {
      this.data[key] = value
      this.writeFile()
    }
  }
  save () {
    ensureFileDir(configPath)
    writeJson(configPath, this.data)
    this.writingFlag = false
  }
}

export const config  = new ConfigManager()
