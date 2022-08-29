import * as path from 'path'
import { app } from 'electron'
import type { PackageInfo } from '../../lib/declares'

export const isDebug = process.argv.indexOf('--debug') >= 1

export const ROOT = ENV_DEV ? app.getAppPath() : path.dirname(process.execPath)
export const RESOURCE = app.getAppPath()
export const PACKAGE = require(path.join(RESOURCE, 'package.json')) as PackageInfo
export const EntryPage = `file://${RESOURCE}/index.html`
